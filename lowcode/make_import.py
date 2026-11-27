"""Builds lowcode/appsmith-import.json from the Practice 13 export (structure template) + lowcode/Checker.js."""
import copy, json, re, sys

src, js_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
d = json.load(open(src, encoding='utf-8'))
body = open(js_path, encoding='utf-8').read()

app = d['exportedApplication']
app['name'] = 'Lab Equipment Loan Checker (low-code)'
app['slug'] = 'lab-equipment-loan-checker-low-code'
app['isPublic'] = False

layout = d['pageList'][0]['unpublishedPage']['layouts'][0]
dsl = layout['dsl']
by = {w['widgetName']: w for w in dsl['children']}
uid = iter(range(1000))


def clone(base, name, top, bottom, **props):
    w = copy.deepcopy(by[base])
    n = next(uid)
    w.update(widgetName=name, widgetId=f'a6w{n:03d}xx', key=f'a6k{n:03d}yy', topRow=float(top), bottomRow=float(bottom),
             mobileTopRow=float(top), mobileBottomRow=float(bottom))
    w.pop('originalTopRow', None); w.pop('originalBottomRow', None)
    w.update(props)
    return w


def text(name, top, bottom, value, **p):
    w = clone('DecisionText', name, top, bottom, text=value, fontStyle=p.pop('fontStyle', ''), **p)
    w['dynamicBindingPathList'] = [{'key': 'truncateButtonColor'}, {'key': 'fontFamily'}, {'key': 'borderRadius'}, {'key': 'text'}]
    return w


select = clone('DurationInput', 'ItemSelect', 2, 9)
for k in ('inputType', 'defaultText', 'resetOnSubmit', 'showStepArrows', 'autoFocus', 'iconAlign', 'maxDynamicHeight', 'minDynamicHeight', 'placeholderText'):
    select.pop(k, None)
select.update(
    type='SELECT_WIDGET', version=1.0, label='Item', placeholderText='- choose an item -',
    sourceData="{{Checker.catalog() ? Checker.catalog().items.map(i => ({ label: i.id + ' - ' + i.name, value: i.id })) : []}}",
    optionLabel='label', optionValue='value', defaultOptionValue='', serverSideFiltering=False, isFilterable=False,
    isRequired=False, isDisabled=False, labelWidth=5.0, labelPosition='Top', labelAlignment='left',
    labelTextSize='0.875rem', responsiveBehavior='fill', minWidth=450.0, dynamicHeight='FIXED', boxShadow='none',
)
select['dynamicBindingPathList'] = [{'key': 'accentColor'}, {'key': 'borderRadius'}, {'key': 'sourceData'}]
select['dynamicPropertyPathList'] = [{'key': 'sourceData'}]

children = [
    select,
    clone('DurationInput', 'QuantityInput', 10, 17, label='Quantity (1-5)', placeholderText='e.g. 2'),
    clone('DurationInput', 'DaysInput', 18, 25, label='Loan days (1-14)', placeholderText='e.g. 7'),
    clone('CheckButton', 'CheckButton', 26, 30, text='Check request', onClick='{{Checker.run();}}'),
    text('CatalogErrorText', 31, 35, "{{Checker.catalog() ? '' : 'The catalog could not be loaded. Try again later.'}}", textColor='#B3261E', fontStyle='BOLD'),
    text('DecisionText', 36, 40, 'Decision: {{Checker.result.decision}}', fontStyle='BOLD'),
    text('ReasonText', 41, 45, 'Reason code: {{Checker.result.reason}}'),
    text('MessageText', 46, 51, '{{Checker.result.message}}'),
    text('IntegrityText', 52, 56, '{{Checker.integrity()}}'),
]
btn = children[2]
btn['isDisabled'] = '{{!Checker.catalog()}}'
btn['dynamicBindingPathList'] = [b for b in btn.get('dynamicBindingPathList', []) if b['key'] != 'isDisabled'] + [{'key': 'isDisabled'}]
# Low-code defect L1 (found in T12): without this entry the imported "Disabled" property was not in JS mode and the
# button stayed enabled. Fixed in the editor on 2026-11-27 by switching Disabled to JS; reproduced here for re-imports.
btn['dynamicPropertyPathList'] = [{'key': 'isDisabled'}]
table = clone('BookingsTable', 'CatalogTable', 60, 88, tableData="{{Checker.catalog() ? Checker.catalog().items : []}}")
children.append(table)
dsl['children'] = children
layout['layoutOnLoadActions'] = []
d['pageList'][0]['publishedPage'] = copy.deepcopy(d['pageList'][0]['unpublishedPage'])

# JS object + one action per function (same shape as the Practice 13 export)
coll = d['actionCollectionList'][0]
coll['unpublishedCollection']['body'] = body
variables = []
for m in re.finditer(r'^\t(\w+): (.+?),$', body, flags=re.M):
    variables.append({'name': m.group(1), 'value': m.group(2)})
coll['unpublishedCollection']['variables'] = variables
coll['publishedCollection'] = copy.deepcopy(coll['unpublishedCollection'])

template = d['actionList'][0]
actions = []
for m in re.finditer(r'^\t(\w+) \(([^)]*)\) \{\n(.*?)^\t\}', body, flags=re.M | re.S):
    name, args, inner = m.group(1), m.group(2), m.group(3)
    fn = f'function ({args}) {{\n{inner}}}'.replace('this.', 'Checker.')
    a = copy.deepcopy(template)
    for side in ('unpublishedAction', 'publishedAction'):
        x = a[side]
        x['name'] = name
        x['fullyQualifiedName'] = f'Checker.{name}'
        x['actionConfiguration']['body'] = fn
        x['actionConfiguration']['jsArguments'] = [{'name': s.strip()} for s in args.split(',') if s.strip()]
        x['jsonPathKeys'] = [fn]
    a['id'] = f'Page1_Checker.{name}'
    a['gitSyncId'] = f'a6_{name}'
    actions.append(a)
d['actionList'] = actions
json.dump(d, open(out, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('functions:', [a['unpublishedAction']['name'] for a in actions])
print('variables:', [v['name'] for v in variables])
print('widgets:', [w['widgetName'] for w in children])
