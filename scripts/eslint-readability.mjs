import stylistic from '@stylistic/eslint-plugin'

const functionTypes = new Set(['ArrowFunctionExpression', 'FunctionExpression'])
const declarations = {
  selector:
    ':matches(VariableDeclaration, ExportNamedDeclaration[declaration.type="VariableDeclaration"])'
}
const overloadDeclarations = {
  selector:
    ':matches(TSDeclareFunction, ExportNamedDeclaration[declaration.type="TSDeclareFunction"], ExportDefaultDeclaration[declaration.type="TSDeclareFunction"])'
}
const functionDeclarations = {
  selector: [
    'FunctionDeclaration',
    'ExportNamedDeclaration[declaration.type="FunctionDeclaration"]',
    'ExportDefaultDeclaration[declaration.type="FunctionDeclaration"]',
    'VariableDeclaration:has(> VariableDeclarator[init.type=/^(ArrowFunctionExpression|FunctionExpression)$/])',
    'ExportNamedDeclaration:has(> VariableDeclaration:has(> VariableDeclarator[init.type=/^(ArrowFunctionExpression|FunctionExpression)$/]))'
  ].join(', ')
}

function isFunctionProperty(property) {
  return property.type === 'Property' && functionTypes.has(property.value.type)
}

function checkObjectSpacing(context, node) {
  const source = context.sourceCode
  const newline = source.text.includes('\r\n') ? '\r\n' : '\n'

  for (let index = 1; index < node.properties.length; index += 1) {
    const previous = node.properties[index - 1]
    const current = node.properties[index]

    if (!isFunctionProperty(previous) && !isFunctionProperty(current)) {
      continue
    }

    const tokens = [
      ...source.getTokensBetween(previous, current, { includeComments: true }),
      source.getFirstToken(current)
    ]
    const hasBlankLine = tokens.some((token, tokenIndex) => {
      if (tokenIndex === 0) {
        return false
      }

      return token.loc.start.line > tokens[tokenIndex - 1].loc.end.line + 1
    })

    if (hasBlankLine) {
      continue
    }

    // Keep same-line comments with the preceding member; separate leading comments.
    let boundary = 0

    while (
      boundary + 1 < tokens.length - 1 &&
      tokens[boundary + 1].loc.start.line === tokens[boundary].loc.end.line
    ) {
      boundary += 1
    }

    const left = tokens[boundary]
    const right = tokens[boundary + 1]
    const indentation =
      source.lines[right.loc.start.line - 1].match(/^[\t ]*/u)[0]

    context.report({
      node: current,
      messageId: 'expectedBlankLine',

      fix(fixer) {
        return fixer.replaceTextRange(
          [left.range[1], right.range[0]],
          `${newline}${newline}${indentation}`
        )
      }
    })
  }
}

const objectFunctionSpacing = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Require blank lines around function-valued object members'
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      expectedBlankLine:
        'Separate function-valued object members with a blank line.'
    }
  },

  create(context) {
    return {
      ObjectExpression(node) {
        checkObjectSpacing(context, node)
      }
    }
  }
}

export default {
  name: 'project/readability',
  plugins: {
    '@stylistic': stylistic,
    readability: { rules: { 'object-function-spacing': objectFunctionSpacing } }
  },
  rules: {
    curly: ['error', 'all'],
    'no-nested-ternary': 'error',
    '@stylistic/padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: declarations, next: '*' },
      { blankLine: 'any', prev: declarations, next: declarations },
      { blankLine: 'always', prev: '*', next: 'return' },
      { blankLine: 'always', prev: ['block-like', 'if', 'do'], next: '*' },
      { blankLine: 'always', prev: '*', next: ['block', 'class'] },
      { blankLine: 'always', prev: functionDeclarations, next: '*' },
      { blankLine: 'always', prev: '*', next: functionDeclarations },
      {
        blankLine: 'any',
        prev: overloadDeclarations,
        next: [overloadDeclarations, functionDeclarations]
      }
    ],
    '@stylistic/lines-between-class-members': ['error', 'always'],
    'readability/object-function-spacing': 'error'
  }
}
