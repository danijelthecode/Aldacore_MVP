# Builds short.html, the shorter version of the homepage, from index.html.
# Every section the brief requires stays; each one shows less at once. Nothing new is written:
# content is only removed, regrouped or linked to the page on newcode.ai that already carries it.
# The review labels ("To confirm", "Placeholder") are taken off the page and listed in short-review-notes.md.
#
#   python3 scripts/build-short.py
import re
from pathlib import Path
from bs4 import BeautifulSoup, Comment

root = Path(__file__).resolve().parent.parent
soup = BeautifulSoup((root / 'index.html').read_text(encoding='utf8'), 'html.parser')
new = soup.new_tag


def one(sel, ctx=soup):
    el = ctx.select_one(sel)
    assert el is not None, sel
    return el


def drop(sel, ctx=soup, count=None):
    els = ctx.select(sel)
    assert els, sel
    if count is not None:
        assert len(els) == count, (sel, len(els))
    for el in els:
        el.decompose()


def frag(html):
    return BeautifulSoup(html, 'html.parser')


ARROW = '<svg class="arrow" aria-hidden="true"><use href="#i-arrow"/></svg>'

# ---- Review labels: collect, then take them off the page ----
notes = []
for el in soup.select('[data-note]'):
    notes.append(' '.join(el['data-note'].split()))
for el in soup.select('.note-line'):
    if el.has_attr('data-note') or el.select_one('[data-note]'):
        continue  # already listed from its data-note
    text = ' '.join(el.get_text(' ').split())
    if text and text not in notes:
        notes.append(text)

# ---- Head ----
one('title').string = 'Newcode | AI for forward-thinking law firms (short version)'
one('link[href="css/styles.css"]').insert_after(frag('<link rel="stylesheet" href="css/short.css">'))
one('body')['class'] = ['is-short']

# ---- Trusted by: the names still light up one by one, but the page no longer holds still for it ----
one('#trusted [data-sweep]')['data-sweep'] = 'free'
for a in one('#trusted').select('a[href="#voice-brecke"], a[href="#story-bar-of-ireland"]'):
    a.unwrap()

# ---- How Newcode works: four steps, one shown at a time ----
how = one('#how')
steps = one('ol.how__steps', how)
del steps['data-rail']
names = []
for i, li in enumerate(steps.select('li.how__step'), 1):
    del li['data-step']
    li['role'] = 'tabpanel'
    li['id'] = f'how-step-{i}'
    li['aria-labelledby'] = f'how-tab-{i}'
    names.append(one('h3', li).get_text())
assert names == ['Connect', 'Contextualize', 'Create', 'Control'], names
tabs = ''.join(
    f'<button class="pview-tab" type="button" role="tab" id="how-tab-{i}" aria-controls="how-step-{i}" '
    f'aria-selected="{"true" if i == 1 else "false"}"{"" if i == 1 else " tabindex=\"-1\""}>'
    f'<span aria-hidden="true">0{i}</span> {n}</button>' for i, n in enumerate(names, 1))
steps.insert_before(frag(f'<div class="pviews how__tabs" role="tablist" aria-label="How Newcode works, step by step">{tabs}</div>'))
one('.wrap', how)['data-tabs'] = ''
one('.wrap', how)['data-autoplay'] = '10000'
# The capability network goes: twelve pills read as a feature list. The Platform overview card in the suite links to the page that carries them.
drop('.how__caps', how, 1)

# ---- Product suite: every product stays; Nova and Aurora show one view, the six others are short doors ----
suite = one('#products')
# Nova and Aurora keep their three feature views: the tabs cost no height.
for card in suite.select('.suite__grid .pcard'):
    for el in card.select('.plate, .pcard__meta, .ph'):
        el.decompose()
    card['class'] = [c for c in card['class'] if c != 'pcard--slot']
# A second way to book a demo, between the hero and the closing band.
one('.suite__grid', suite).insert_after(frag(
    '<p class="short__cta"><a class="btn btn--primary" href="https://www.newcode.ai/contact" target="_blank" rel="noopener">'
    f'Book a demo {ARROW}</a></p>'))

# ---- The separate harness band: How already carries its title ----
drop('#harness', count=1)
for c in soup.find_all(string=lambda s: isinstance(s, Comment) and 'configurable AI harness: the live site' in s):
    c.extract()

# ---- Proof numbers: published figures only ----
drop('#proof .proof__pending', count=1)

# ---- Customer voices: the three the brief names ----
voices = one('#customers')
drop('#voice-brecke, #voice-oskarsson, #story-bar-of-ireland', voices, 3)
for c in voices.find_all(string=lambda s: isinstance(s, Comment)):
    c.extract()
# The Rattigan quote sits beside the Raeder Bing film, under the Canning quote.
one('.voices__stories', voices).insert(0, one('#voice-rattigan', voices).extract())
drop('.voices__more', voices, 1)
one('.voices__stories', voices).insert_after(frag(
    '<p class="short__more"><a class="link-arrow" href="https://www.newcode.ai/customers" target="_blank" rel="noopener">'
    f'<span>More customer stories on newcode.ai</span> {ARROW}</a></p>'))

# ---- Solutions: the five audiences; the full practice list stays on newcode.ai ----
sol = one('#solutions')
drop('.spanel__areas', sol, 5)
drop('#practice-areas', sol, 1)
one('#solutions-tabs', sol).insert_after(frag(
    '<p class="short__more"><a class="link-arrow" href="https://www.newcode.ai/solutions" target="_blank" rel="noopener">'
    f'<span>See every practice area on newcode.ai</span> {ARROW}</a></p>'))
for a in soup.select('a[href="#practice-areas"]'):
    a['href'] = '#solutions'

# ---- Integrations: one row of the systems, plus the MCP figure ----
integ = one('#integrations')
drop('.integrations__side figure', integ, 1)
# Word has no icon yet (only a placeholder), so its tile waits; the Word Add In card in the suite still names it.
word = one('.itile__icon--ph', integ).find_parent('li')
word.decompose()
# Logos and names only: which product uses each system is still to be confirmed (see the notes file).
for el in integ.select('.itile > span:not(.itile__icon), .itile .tag'):
    el.decompose()
for i, li in enumerate(integ.select('.itiles li')):
    li['style'] = f'--i:{i}'
notes.append('Integrations: the Word tile is left out of the short version until a Word icon is available.')

# ---- Academy: one line naming the programmes, the photo and list stay on newcode.ai ----
academy = one('#academy .academy')
progs = [b.get_text() for b in academy.select('.academy__list b')]
assert progs[:4] == ['AI Enablement Programme', 'Workshops', 'Trainings', 'Industrial PhD'], progs
drop('.academy__photo', academy, 1)
drop('.academy__list', academy, 1)
one('.academy__lead', academy).insert_after(frag(
    '<ul class="chips chips--quiet academy__progs" aria-label="Academy programs">' + ''.join(f'<li>{n}</li>' for n in progs[:4]) + '</ul>'))

# ---- News: the three headlines, the summaries stay on the posts ----
drop('#news .news__list em', count=3)

# ---- Hero: the promise reads as one phrase, the shape follows the pointer more calmly ----
h1 = one('#hero-title')
assert h1.decode_contents() == 'AI for forward-<br/>thinking law firms', h1.decode_contents()
h1.clear()
h1.append(frag('AI for forward‑thinking<br/>law firms'))
shape = one('.hero [data-shape]')
shape['data-lean'] = '16'
shape['data-max-rate'] = '2'
dla = one('.hero__logos img[alt="DLA Piper"]')
dla['style'] = dla['style'].replace('--u:2.1', '--u:1.8')  # size only, to match the other marks' weight
one('.site-header')['data-autohide'] = ''

# ---- Trusted by: the names as a quiet list in columns, still lighting one by one ----
for t in soup.select('#trusted [data-sweep-item]'):
    # names wrapped in a link carry their comma after the link
    if t.contents and isinstance(t.contents[-1], str):
        t.contents[-1].replace_with(t.contents[-1].rstrip().rstrip(',.'))
assert not any(t.get_text().strip().endswith(',') for t in soup.select('#trusted [data-sweep-item]'))

# ---- One dark chapter in the middle: the numbers, then security, on the ink ground ----
proof, security = one('#proof'), one('#security')
proof['class'] = [c for c in proof['class'] if c != 'band--white'] + ['proof--dark', 'on-dark']
proof.insert_after(security.extract())
for el in proof.select('[data-count]'):
    el['data-count-once'] = ''

# ---- Nova and Aurora: the view tabs above the picture; Nova steps through its views ----
for card in suite.select('.pcard--large'):
    one('.plate', card).insert_before(one('.pviews', card).extract())

# ---- Solutions: the audiences step through on their own until someone picks one ----

# ---- Labels and their wrappers, everywhere ----
for el in soup.select('.note-line, .flag, .ph__tag, .photo-note, .plate__note'):
    el.decompose()
for el in soup.select('[data-note]'):
    del el['data-note']

out = str(soup)
assert 'To confirm' not in out and 'Placeholder' not in out
(root / 'short.html').write_text(out, encoding='utf8')
(root / 'short-review-notes.md').write_text(
    '# Open points taken off the short version\n\n'
    'Generated by scripts/build-short.py from the labels on index.html. They are review notes, not page copy.\n\n'
    + ''.join(f'- {n}\n' for n in notes), encoding='utf8')
print('short.html written,', len(notes), 'review notes')
