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
                version: '^19.0.14',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-grid',
                version: '^19.0.33',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-popup',
                version: '^19.0.18',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-select',
                version: '^19.0.4',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-toast',
                version: '^19.0.3',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-tooltip',
                version: '^19.0.1',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-treeview',
                version: '^19.0.17',
                overwrite: true
              },
              {
                type: NodeDependencyType.Default,
                name: 'flexi-stepper',
                version: '^19.0.6',
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