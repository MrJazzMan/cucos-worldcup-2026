"""
bracket_layout.py
=================

Motor de layout para um bracket radial (circular) da fase a eliminar do
Mundial 2026, pensado para exportar coordenadas e caminhos SVG para o wc26.pt
(KnockoutBracketRadial + knockout-bracket-radial-layout.ts).

O que este ficheiro entrega:
  - TEAM_ORDER / LEFT_HALF / RIGHT_HALF          (ordem angular das bandeiras)
  - node_positions() -> dict[node_id, (x, y, radius)]
  - angle_for(slot_id) -> graus (0 = topo, sentido horario)
  - connector_path(a, b, style) -> string de <path d="...">
  - highlight_path(node_id) / path_edges(node_id)   (regra de estado/caminho)
  - to_json() e um __main__ que grava bracket_layout.json + bracket_preview.svg

Topologia: oficial FIFA 2026 (M73-M104), incluindo o facto de o mapa de
alimentacao NAO ser sequencial (ex.: M89 <- M74, M77 ; M98 <- M93, M94).
Fonte da topologia: regulamento FIFA / 2026 FIFA World Cup knockout stage.

A ordem angular das 32 bandeiras e derivada por travessia in-order da arvore
real. E isto que garante que os conectores nunca se cruzam.

Nota de verificacao [Unverified]: o dicionario SAMPLE_TEAMS mais abaixo e
apenas ilustrativo (cenario do poster) para o preview; a associacao
equipa <-> match_id oficial deve vir dos dados reais (tabela Match). A
topologia (FEED / R32_SLOTS) essa sim e a oficial.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass, field

# --------------------------------------------------------------------------
# 1. Geometria da tela
# --------------------------------------------------------------------------

CANVAS = 1000.0
CX = CY = CANVAS / 2.0

# Raio de cada ronda, do exterior (bandeiras) para o centro (trofeu).
RADIUS = {
    "slot": 435.0,   # 32 bandeiras no anel exterior
    "R32": 365.0,    # M73-M88
    "R16": 290.0,    # M89-M96
    "QF": 210.0,     # M97-M100
    "SF": 130.0,     # M101-M102
    "F": 0.0,        # M104 no centro (trofeu)
}

HALF_GAP_DEG = 12.0   # folga no topo e no fundo entre as duas metades do quadro
PAIR_TIGHTEN = 0.42   # 0..1: aproxima as duas bandeiras do mesmo jogo


# --------------------------------------------------------------------------
# 2. Topologia oficial FIFA 2026 (M73-M104)
# --------------------------------------------------------------------------

# Slots do Round of 32: (rotulo_topo, rotulo_fundo) por posicao de grupo.
R32_SLOTS = {
    "M73": ("RU-A", "RU-B"),
    "M74": ("W-E", "3rd-ABCDF"),
    "M75": ("W-F", "RU-C"),
    "M76": ("W-C", "RU-F"),
    "M77": ("W-I", "3rd-CDFGH"),
    "M78": ("RU-E", "RU-I"),
    "M79": ("W-A", "3rd-CEFHI"),
    "M80": ("W-L", "3rd-EHIJK"),
    "M81": ("W-D", "3rd-BEFIJ"),
    "M82": ("W-G", "3rd-AEHIJ"),
    "M83": ("RU-K", "RU-L"),
    "M84": ("W-H", "RU-J"),
    "M85": ("W-B", "3rd-EFGIJ"),
    "M86": ("W-J", "RU-H"),
    "M87": ("W-K", "3rd-DEIJL"),
    "M88": ("RU-D", "RU-G"),
}

# Quem alimenta quem (vencedores). Ordem [primeiro, segundo] como no bracket FIFA.
# ATENCAO: nao e sequencial. Isto vem do quadro oficial.
FEED = {
    "M89": ("M74", "M77"),
    "M90": ("M73", "M75"),
    "M91": ("M76", "M78"),
    "M92": ("M79", "M80"),
    "M93": ("M83", "M84"),
    "M94": ("M81", "M82"),
    "M95": ("M86", "M88"),
    "M96": ("M85", "M87"),
    "M97": ("M89", "M90"),
    "M98": ("M93", "M94"),
    "M99": ("M91", "M92"),
    "M100": ("M95", "M96"),
    "M101": ("M97", "M98"),
    "M102": ("M99", "M100"),
    "M104": ("M101", "M102"),
}

# 3o lugar: fora da arvore radial (perdedores das meias-finais).
THIRD_PLACE = ("M103", ("M101", "M102"))
ROOT = "M104"

# match_id -> ronda
ROUND_OF: dict[str, str] = {}
for _m in R32_SLOTS:
    ROUND_OF[_m] = "R32"
for _m in ("M89", "M90", "M91", "M92", "M93", "M94", "M95", "M96"):
    ROUND_OF[_m] = "R16"
for _m in ("M97", "M98", "M99", "M100"):
    ROUND_OF[_m] = "QF"
for _m in ("M101", "M102"):
    ROUND_OF[_m] = "SF"
ROUND_OF["M104"] = "F"


# --------------------------------------------------------------------------
# 3. Construcao da arvore
# --------------------------------------------------------------------------

@dataclass
class Node:
    id: str
    round: str
    is_slot: bool = False
    label: str | None = None      # rotulo de grupo (so slots)
    match: str | None = None      # jogo a que o slot pertence (so slots)
    children: list[str] = field(default_factory=list)
    angle: float = 0.0            # graus, 0 = topo, sentido horario
    radius: float = 0.0
    x: float = 0.0
    y: float = 0.0


def _build_nodes() -> dict[str, Node]:
    nodes: dict[str, Node] = {}

    # Jogos internos (R16..Final): filhos = os dois jogos que os alimentam.
    for mid, feeders in FEED.items():
        nodes[mid] = Node(id=mid, round=ROUND_OF[mid], children=list(feeders))

    # Jogos do R32: filhos = os dois slots (bandeiras).
    for mid, (top, bot) in R32_SLOTS.items():
        sa, sb = f"{mid}.A", f"{mid}.B"
        nodes[mid] = Node(id=mid, round="R32", children=[sa, sb])
        nodes[sa] = Node(id=sa, round="slot", is_slot=True, label=top, match=mid)
        nodes[sb] = Node(id=sb, round="slot", is_slot=True, label=bot, match=mid)

    return nodes


def _inorder_slots(nodes: dict[str, Node], nid: str) -> list[str]:
    """Ordem angular das bandeiras: travessia in-order da arvore (sem cruzamentos)."""
    node = nodes[nid]
    if node.is_slot:
        return [nid]
    out: list[str] = []
    for c in node.children:
        out += _inorder_slots(nodes, c)
    return out


def polar(r: float, ang_deg: float) -> tuple[float, float]:
    """(x, y) a partir de (raio, angulo). 0 graus = topo; angulo cresce no sentido horario."""
    a = math.radians(ang_deg)
    return (CX + r * math.sin(a), CY - r * math.cos(a))


def _assign_geometry(nodes: dict[str, Node]) -> list[str]:
    leaves = _inorder_slots(nodes, ROOT)  # 32 slots
    n = len(leaves)
    half = n // 2
    half_arc = 180.0 - HALF_GAP_DEG
    step = half_arc / half  # espaco angular por slot dentro de cada metade

    # Angulos das bandeiras (com folga no topo/fundo e aproximacao por par).
    for i, sid in enumerate(leaves):
        side = 0 if i < half else 1
        k = i if side == 0 else i - half            # 0..15 dentro da metade
        base = HALF_GAP_DEG / 2.0 + (k + 0.5) * step
        pair_centre = HALF_GAP_DEG / 2.0 + ((k // 2) * 2 + 1) * step
        ang = base + (pair_centre - base) * PAIR_TIGHTEN
        ang += 0.0 if side == 0 else 180.0
        nd = nodes[sid]
        nd.angle = ang
        nd.radius = RADIUS["slot"]
        nd.x, nd.y = polar(nd.radius, ang)

    # Angulo de cada jogo = media dos filhos; raio pela ronda. Bottom-up.
    order = ["R32", "R16", "QF", "SF", "F"]
    for rnd in order:
        for nid, nd in nodes.items():
            if nd.round != rnd or nd.is_slot:
                continue
            ch = [nodes[c] for c in nd.children]
            nd.angle = sum(c.angle for c in ch) / len(ch)
            nd.radius = RADIUS[rnd]
            if nd.radius == 0.0:               # Final -> centro (trofeu)
                nd.x, nd.y = CX, CY
            else:
                nd.x, nd.y = polar(nd.radius, nd.angle)

    return leaves


_NODES = _build_nodes()
_LEAVES = _assign_geometry(_NODES)

# Ordem angular exportavel
TEAM_ORDER = _LEAVES  # 32 slot ids, in-order (sentido horario a partir do topo)
RIGHT_HALF = _LEAVES[: len(_LEAVES) // 2]   # metade "M101" (nascente)
LEFT_HALF = _LEAVES[len(_LEAVES) // 2:]     # metade "M102" (poente)


# --------------------------------------------------------------------------
# 4. API publica
# --------------------------------------------------------------------------

def node_positions() -> dict[str, tuple[float, float, float]]:
    """dict[node_id] = (x, y, radius) para todos os nos (jogos + slots)."""
    return {nid: (round(nd.x, 2), round(nd.y, 2), round(nd.radius, 2))
            for nid, nd in _NODES.items()}


def angle_for(slot_id: str) -> float:
    """Angulo (graus, 0 = topo, sentido horario) de um no."""
    return round(_NODES[slot_id].angle, 3)


def _short_cw(a_from: float, a_to: float) -> bool:
    """True se o arco curto de a_from para a_to for no sentido horario."""
    return (a_to - a_from) % 360.0 < 180.0


def connector_path(a_id: str, b_id: str, style: str = "elbow") -> str:
    """
    String para <path d="..."> a ligar dois nos.
      style="elbow"    -> segmento radial + arco (dendrograma radial, como o poster)
      style="straight" -> linha reta
      style="bezier"   -> curva suave (quadratica) via ponto radial
    O no exterior (maior raio) liga-se ao interior (menor raio).
    """
    A, B = _NODES[a_id], _NODES[b_id]
    outer, inner = (A, B) if A.radius >= B.radius else (B, A)
    ox, oy = outer.x, outer.y
    ix, iy = inner.x, inner.y

    if style == "straight" or inner.radius == 0.0:
        return f"M {ox:.2f} {oy:.2f} L {ix:.2f} {iy:.2f}"

    # ponto de dobra: angulo do exterior, ja no raio do interior
    jx, jy = polar(inner.radius, outer.angle)

    if style == "bezier":
        return (f"M {ox:.2f} {oy:.2f} "
                f"Q {jx:.2f} {jy:.2f} {ix:.2f} {iy:.2f}")

    # elbow (default): radial ate ao raio do pai, depois arco ate ao pai
    sweep = 1 if _short_cw(outer.angle, inner.angle) else 0
    r = inner.radius
    return (f"M {ox:.2f} {oy:.2f} "
            f"L {jx:.2f} {jy:.2f} "
            f"A {r:.2f} {r:.2f} 0 0 {sweep} {ix:.2f} {iy:.2f}")


def edges() -> list[tuple[str, str]]:
    """Todas as arestas (filho_exterior, pai_interior) da arvore radial."""
    out: list[tuple[str, str]] = []
    for nid, nd in _NODES.items():
        if nd.is_slot:
            continue
        for c in nd.children:
            out.append((c, nid))
    return out


def parent_of() -> dict[str, str]:
    p: dict[str, str] = {}
    for nid, nd in _NODES.items():
        for c in nd.children:
            p[c] = nid
    return p


def path_to_root(node_id: str) -> list[str]:
    """Lista de node_ids do no dado ate ao centro (M104)."""
    p = parent_of()
    chain, cur = [node_id], node_id
    while cur in p:
        cur = p[cur]
        chain.append(cur)
    return chain


def path_edges(node_id: str) -> list[tuple[str, str]]:
    """Arestas (exterior, interior) ao longo do caminho ate ao centro."""
    chain = path_to_root(node_id)
    return list(zip(chain[:-1], chain[1:]))


# --------------------------------------------------------------------------
# 5. Regras de estado / cor (referencia para portar para React)
# --------------------------------------------------------------------------

COLORS = {
    "bg": "#0b0b0d",
    "line": "#33333a",      # conector normal
    "line_dim": "#232329",  # conector de ramo ja resolvido/apagado
    "node": "#4a4a52",
    "path": "#E9B949",      # caminho destacado (dourado)
    "advanced": "#f0ead6",  # bandeira que subiu de ronda
    "eliminated": "#5a5a60",  # bandeira eliminada (cinzenta)
    "trophy": "#F4C95D",
}

# Como o poster: um caminho por cor (vermelho / dourado / verde).
PATH_ACCENTS = ["#d64b3f", "#E9B949", "#3fae6a", "#3f8fd6"]

STATE_RULES = {
    "advance": "vencedor de um jogo ocupa o no do jogo seguinte (raio menor)",
    "eliminate": "perdedor fica com fill=eliminated e sem caminho para dentro",
    "highlight": "path_edges(slot) devolve as arestas a pintar com PATH_ACCENTS",
}


# --------------------------------------------------------------------------
# 6. Sample ilustrativo (cenario do poster) - so para o preview [Unverified]
# --------------------------------------------------------------------------

SAMPLE_TEAMS = {
    "M73": ("South Africa", "Canada"),
    "M74": ("Germany", "Paraguay"),
    "M75": ("Netherlands", "Morocco"),
    "M76": ("Brazil", "Japan"),
    "M77": ("France", "Sweden"),
    "M78": ("Cote d'Ivoire", "Norway"),
    "M79": ("Mexico", "Ecuador"),
    "M80": ("England", "Congo DR"),
    "M81": ("USA", "Bosnia"),
    "M82": ("Belgium", "Senegal"),
    "M83": ("Argentina", "Cape Verde"),
    "M84": ("Australia", "Egypt"),
    "M85": ("Switzerland", "Algeria"),
    "M86": ("Colombia", "Ghana"),
    "M87": ("Austria", "Spain"),
    "M88": ("Croatia", "Portugal"),
}

_ABBR = {
    "South Africa": "RSA", "Canada": "CAN", "Germany": "GER", "Paraguay": "PAR",
    "Netherlands": "NED", "Morocco": "MAR", "Brazil": "BRA", "Japan": "JPN",
    "France": "FRA", "Sweden": "SWE", "Cote d'Ivoire": "CIV", "Norway": "NOR",
    "Mexico": "MEX", "Ecuador": "ECU", "England": "ENG", "Congo DR": "COD",
    "USA": "USA", "Bosnia": "BIH", "Belgium": "BEL", "Senegal": "SEN",
    "Argentina": "ARG", "Cape Verde": "CPV", "Australia": "AUS", "Egypt": "EGY",
    "Switzerland": "SUI", "Algeria": "ALG", "Colombia": "COL", "Ghana": "GHA",
    "Austria": "AUT", "Spain": "ESP", "Croatia": "CRO", "Portugal": "POR",
}


def sample_slot_label(slot_id: str) -> str:
    mid = _NODES[slot_id].match
    idx = 0 if slot_id.endswith(".A") else 1
    name = SAMPLE_TEAMS.get(mid, (mid, mid))[idx]
    return _ABBR.get(name, name[:3].upper())


# --------------------------------------------------------------------------
# 7. Exportacao JSON
# --------------------------------------------------------------------------

def to_json() -> dict:
    nodes_out = []
    for nid, nd in _NODES.items():
        nodes_out.append({
            "id": nid,
            "round": nd.round,
            "is_slot": nd.is_slot,
            "label": nd.label,
            "match": nd.match,
            "children": nd.children,
            "angle": round(nd.angle, 3),
            "radius": round(nd.radius, 2),
            "x": round(nd.x, 2),
            "y": round(nd.y, 2),
        })
    edges_out = []
    for (a, b) in edges():
        edges_out.append({
            "from": a,
            "to": b,
            "path_elbow": connector_path(a, b, "elbow"),
            "path_straight": connector_path(a, b, "straight"),
        })
    return {
        "canvas": {"size": CANVAS, "cx": CX, "cy": CY},
        "radius": RADIUS,
        "team_order": TEAM_ORDER,
        "left_half": LEFT_HALF,
        "right_half": RIGHT_HALF,
        "feed": {k: list(v) for k, v in FEED.items()},
        "r32_slots": {k: list(v) for k, v in R32_SLOTS.items()},
        "third_place": {"id": THIRD_PLACE[0], "feeders": list(THIRD_PLACE[1])},
        "colors": COLORS,
        "nodes": nodes_out,
        "edges": edges_out,
    }


# --------------------------------------------------------------------------
# 8. Preview SVG (verificacao visual; nao e o componente final)
# --------------------------------------------------------------------------

def render_svg(highlight_slot: str | None = "M74.B") -> str:
    """SVG autonomo so para confirmar a geometria. Usa abreviaturas em vez de bandeiras."""
    hi = set()
    if highlight_slot:
        for (a, b) in path_edges(highlight_slot):
            hi.add((a, b))
    hi_nodes = set(path_to_root(highlight_slot)) if highlight_slot else set()

    parts = [
        f'<svg viewBox="0 0 {CANVAS:.0f} {CANVAS:.0f}" xmlns="http://www.w3.org/2000/svg">',
        f'<rect width="{CANVAS:.0f}" height="{CANVAS:.0f}" fill="{COLORS["bg"]}"/>',
    ]
    # aneis guia
    for r in (RADIUS["R32"], RADIUS["R16"], RADIUS["QF"], RADIUS["SF"]):
        parts.append(f'<circle cx="{CX}" cy="{CY}" r="{r}" fill="none" '
                     f'stroke="#ffffff" stroke-opacity="0.04"/>')
    # conectores
    for (a, b) in edges():
        on = (a, b) in hi
        d = connector_path(a, b, "elbow")
        parts.append(f'<path d="{d}" fill="none" '
                     f'stroke="{COLORS["path"] if on else COLORS["line"]}" '
                     f'stroke-width="{3.2 if on else 1.4}" stroke-linecap="round"/>')
    # nos internos
    for nid, nd in _NODES.items():
        if nd.is_slot or nd.round == "F":
            continue
        on = nid in hi_nodes
        parts.append(f'<circle cx="{nd.x:.1f}" cy="{nd.y:.1f}" '
                     f'r="{5 if on else 3}" '
                     f'fill="{COLORS["path"] if on else COLORS["node"]}"/>')
    # slots (bandeiras -> abreviatura)
    for sid in _LEAVES:
        nd = _NODES[sid]
        on = sid in hi_nodes
        is_pt = sample_slot_label(sid) == "POR"
        stroke = COLORS["path"] if on else ("#b98f2e" if is_pt else "#3a3a42")
        parts.append(f'<circle cx="{nd.x:.1f}" cy="{nd.y:.1f}" r="26" '
                     f'fill="#141418" stroke="{stroke}" '
                     f'stroke-width="{3 if on else (2 if is_pt else 1)}"/>')
        txt = COLORS["path"] if on else ("#E9B949" if is_pt else "#c9c9cf")
        parts.append(f'<text x="{nd.x:.1f}" y="{nd.y:.1f}" text-anchor="middle" '
                     f'dominant-baseline="central" font-size="15" font-weight="600" '
                     f'font-family="Arial, sans-serif" fill="{txt}">{sample_slot_label(sid)}</text>')
    # trofeu (centro)
    parts.append(f'<circle cx="{CX}" cy="{CY}" r="34" fill="{COLORS["trophy"]}" '
                 f'fill-opacity="0.15"/>')
    parts.append(f'<text x="{CX}" y="{CY}" text-anchor="middle" dominant-baseline="central" '
                 f'font-size="30" fill="{COLORS["trophy"]}">&#9733;</text>')
    parts.append("</svg>")
    return "\n".join(parts)


# --------------------------------------------------------------------------
# 9. Execucao directa
# --------------------------------------------------------------------------

if __name__ == "__main__":
    data = to_json()
    with open("bracket_layout.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    with open("bracket_preview.svg", "w", encoding="utf-8") as f:
        f.write(render_svg())

    print(f"nos:          {len(data['nodes'])}")
    print(f"arestas:      {len(data['edges'])}")
    print(f"bandeiras:    {len(TEAM_ORDER)}")
    print(f"metade dir.:  {len(RIGHT_HALF)}   metade esq.: {len(LEFT_HALF)}")
    print("exemplo angle_for('M74.B'):", angle_for("M74.B"))
    print("exemplo connector M74->M89:")
    print("  ", connector_path("M74", "M89", "elbow"))
    print("caminho de M74.B (Paraguai) ate ao centro:", path_to_root("M74.B"))
