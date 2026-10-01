with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

for i in range(1, 9):
    content = content.replace(f'data-group="sem{i}-proj"', f'data-group="sem{i}"')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
