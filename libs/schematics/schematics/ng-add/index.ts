import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import {
    addPackageJsonDependency,
    NodeDependencyType,
    NodeDependency
  } from '@schematics/angular/utility/dependencies';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

export function ngAdd() : Rule {
    return (tree: Tree, context: SchematicContext) => {
        const dependencies: NodeDependency[] = [
              {
                type: NodeDependencyType.Default,
                name: 'flexi-button',
                version: '^20.0.0',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-report',
                version: '^20.0.0',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-grid',
                version: '^20.0.0',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-popup',
                version: '^20.0.0',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-select',
                version: '^20.0.0',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-toast',
                version: '^20.0.0',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-tooltip',
                version: '^20.0.0',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-treeview',
                version: '^20.0.0',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-stepper',
                version: '^20.0.0',
                overwrite: true
              }
        ];

        dependencies.forEach(dep => {
        addPackageJsonDependency(tree, dep);
        context.logger.info(`✔️ Added dependency: ${dep.name} (${dep.version})`);
        });

        // Otomatik "npm install" tetikleyici
        context.addTask(new NodePackageInstallTask());

        return tree;
    }
}