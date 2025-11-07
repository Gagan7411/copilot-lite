import { parse as babelParse } from '@babel/parser';
import traverse from '@babel/traverse';
import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type { Diagnostic } from '@codefixer/common';

export interface AnalyzerOptions {
  language: 'js' | 'ts';
  code: string;
  filePath?: string;
}

interface Scope {
  declared: Set<string>;
  used: Set<string>;
  imported: Set<string>;
}

export function analyze(options: AnalyzerOptions): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  if (options.language === 'ts') {
    return analyzeTypeScript(options.code, diagnostics);
  } else {
    return analyzeJavaScript(options.code, diagnostics);
  }
}

function analyzeJavaScript(code: string, diagnostics: Diagnostic[]): Diagnostic[] {
  try {
    const ast = babelParse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    const scope: Scope = {
      declared: new Set(),
      used: new Set(),
      imported: new Set()
    };

    const references = new Map<string, number[]>();
    const declarations = new Map<string, number>();
    const imports = new Map<string, { start: number; end: number; source: string }>();

    traverse(ast, {
      ImportDeclaration(path) {
        path.node.specifiers.forEach(spec => {
          let name = '';
          if (t.isImportDefaultSpecifier(spec)) {
            name = spec.local.name;
          } else if (t.isImportSpecifier(spec)) {
            name = spec.local.name;
          } else if (t.isImportNamespaceSpecifier(spec)) {
            name = spec.local.name;
          }

          if (name) {
            scope.imported.add(name);
            scope.declared.add(name);
            declarations.set(name, path.node.start!);
            imports.set(name, {
              start: path.node.start!,
              end: path.node.end!,
              source: t.isStringLiteral(path.node.source) ? path.node.source.value : ''
            });
          }
        });
      },

      VariableDeclarator(path) {
        if (t.isIdentifier(path.node.id)) {
          const name = path.node.id.name;
          scope.declared.add(name);
          declarations.set(name, path.node.start!);
        }
      },

      FunctionDeclaration(path) {
        if (path.node.id) {
          const name = path.node.id.name;
          scope.declared.add(name);
          declarations.set(name, path.node.start!);
        }
      },

      Identifier(path: any) {
        const name = path.node.name;

        if (path.isBindingIdentifier()) {
          return;
        }

        const parent = path.findParent((p: any) =>
          p.isImportSpecifier() ||
          p.isImportDefaultSpecifier() ||
          p.isVariableDeclarator() ||
          p.isFunctionDeclaration()
        );

        if (parent) {
          return;
        }

        scope.used.add(name);
        if (!references.has(name)) {
          references.set(name, []);
        }
        if (path.node.start !== null && path.node.start !== undefined) {
          references.get(name)!.push(path.node.start);
        }
      },

      MemberExpression(path) {
        if (t.isIdentifier(path.node.object)) {
          const objName = path.node.object.name;

          if (t.isIdentifier(path.node.property) && !path.node.computed) {
            const propName = path.node.property.name;

            if (!scope.declared.has(objName) && objName !== 'console' && objName !== 'process') {
              diagnostics.push({
                ruleId: 'R3',
                message: `Possible null/undefined access: '${objName}.${propName}' - '${objName}' might be null or undefined`,
                start: path.node.start!,
                end: path.node.end!,
                severity: 'warning',
                quickFixable: false
              });
            }
          }
        }
      },

      CallExpression(path) {
        if (
          t.isMemberExpression(path.node.callee) &&
          t.isIdentifier(path.node.callee.property) &&
          path.node.callee.property.name === 'then'
        ) {
          const parent = path.parentPath;
          let hasAwait = false;

          let current: NodePath<any> | null = path;
          while (current) {
            if (t.isAwaitExpression(current.node)) {
              hasAwait = true;
              break;
            }
            current = current.parentPath;
          }

          if (!hasAwait) {
            let inAsyncFunction = false;
            let checkPath: NodePath<any> | null = path;
            while (checkPath) {
              if (
                (t.isFunctionDeclaration(checkPath.node) ||
                 t.isFunctionExpression(checkPath.node) ||
                 t.isArrowFunctionExpression(checkPath.node)) &&
                checkPath.node.async
              ) {
                inAsyncFunction = true;
                break;
              }
              checkPath = checkPath.parentPath;
            }

            if (inAsyncFunction) {
              diagnostics.push({
                ruleId: 'R4',
                message: 'Missing await on promise in async function',
                start: path.node.start!,
                end: path.node.end!,
                severity: 'warning',
                quickFixable: false
              });
            }
          }
        }
      }
    });

    scope.imported.forEach(name => {
      if (!scope.used.has(name)) {
        const importInfo = imports.get(name);
        if (importInfo) {
          diagnostics.push({
            ruleId: 'R1',
            message: `Unused import: '${name}'`,
            start: importInfo.start,
            end: importInfo.end,
            severity: 'info',
            quickFixable: true
          });
        }
      }
    });

    scope.used.forEach(name => {
      if (
        !scope.declared.has(name) &&
        name !== 'console' &&
        name !== 'process' &&
        name !== 'require' &&
        name !== 'module' &&
        name !== 'exports' &&
        name !== 'global' &&
        name !== '__dirname' &&
        name !== '__filename' &&
        !isBuiltInGlobal(name)
      ) {
        const positions = references.get(name) || [];
        positions.forEach(pos => {
          diagnostics.push({
            ruleId: 'R2',
            message: `Missing import for '${name}'`,
            start: pos,
            end: pos + name.length,
            severity: 'error',
            quickFixable: false
          });
        });
      }
    });

  } catch (error) {
    console.error('Parse error:', error);
  }

  return diagnostics;
}

function analyzeTypeScript(code: string, diagnostics: Diagnostic[]): Diagnostic[] {
  return analyzeJavaScript(code, diagnostics);
}

function isBuiltInGlobal(name: string): boolean {
  const builtins = [
    'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math',
    'Number', 'Object', 'Promise', 'RegExp', 'String', 'Symbol',
    'undefined', 'null', 'NaN', 'Infinity', 'parseInt', 'parseFloat',
    'isNaN', 'isFinite', 'decodeURI', 'encodeURI', 'Map', 'Set',
    'WeakMap', 'WeakSet', 'Proxy', 'Reflect', 'setTimeout', 'setInterval',
    'clearTimeout', 'clearInterval', 'window', 'document', 'location',
    'navigator', 'fetch', 'Response', 'Request', 'Headers', 'URL'
  ];
  return builtins.includes(name);
}

export function generateRuleBasedFix(code: string, diagnostic: Diagnostic): string | null {
  if (diagnostic.ruleId !== 'R1') {
    return null;
  }

  const lines = code.split('\n');
  let currentPos = 0;
  let lineNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineEnd = currentPos + lines[i].length;

    if (diagnostic.start >= currentPos && diagnostic.start <= lineEnd) {
      lineNum = i;
      break;
    }

    currentPos = lineEnd + 1;
  }

  const beforeLines = lines.slice(0, lineNum);
  const afterLines = lines.slice(lineNum + 1);
  const fixedCode = [...beforeLines, ...afterLines].join('\n');

  const originalLines = code.split('\n');
  const fixedLines = fixedCode.split('\n');

  let diff = `--- original\n+++ fixed\n`;
  diff += `@@ -${lineNum + 1},1 +${lineNum + 1},0 @@\n`;
  diff += `-${originalLines[lineNum]}\n`;

  return diff;
}
