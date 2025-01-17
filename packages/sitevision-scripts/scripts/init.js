import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as properties from '../util/properties.js';
import { templatifyFile } from '../util/templatify.js';
import { walkFiles } from '../util/walkFiles.js';
import { questions } from '../config/setup-questions.js';
import spawn from 'cross-spawn';
import { getDirname } from '../util/dirname.js';

const copyTemplateFiles = (type, options) => {
  console.log('Copying template files');
  fs.copySync(
    path.resolve(getDirname(import.meta.url), '..', 'template', type),
    '.'
  );

  // Can be used to replace stuff in the templates,
  // one option would be to gather info for the manifest and populate it
  walkFiles('.', (filePath) => templatifyFile(filePath, options), [
    'node_modules',
  ]);

  // Can't name the file .gitignore https://github.com/npm/npm/issues/1862
  fs.moveSync('gitignore', '.gitignore');
};

const writePackageJson = (content) => {
  fs.writeFileSync(
    properties.PACKAGE_JSON_PATH,
    JSON.stringify(content, null, 2)
  );
};

const getCommonPackageProperties = () => {
  const appPackage = properties.getPackageJson();
  appPackage.scripts = {
    build: 'sitevision-scripts build',
    'create-addon': 'sitevision-scripts create-addon',
    'deploy-prod': 'sitevision-scripts deploy-prod',
    sign: 'sitevision-scripts sign',
    dev: 'sitevision-scripts dev',
    'setup-dev-properties': 'sitevision-scripts setup-dev-properties',
    test: 'sitevision-scripts test',
  };

  return appPackage;
};

const updatePackageJsonReact = (typescript) => {
  const appPackage = getCommonPackageProperties();
  const extendsArr = [
    '@sitevision/eslint-config-recommended',
    '@sitevision/eslint-config-webapp-react',
  ];

  if (typescript) {
    extendsArr.push('@sitevision/eslint-config-typescript');
  }

  appPackage.eslintConfig = {
    extends: extendsArr,
  };

  appPackage.prettier = {};
  appPackage.postcss = {
    plugins: ['autoprefixer'],
  };

  writePackageJson(appPackage);
};

const updatePackageJsonBundledRest = (typescript) => {
  const appPackage = getCommonPackageProperties();
  const extendsArr = ['@sitevision/eslint-config-recommended'];

  if (typescript) {
    extendsArr.push('@sitevision/eslint-config-typescript');
  }

  appPackage.eslintConfig = {
    extends: extendsArr,
  };

  appPackage.prettier = {};

  writePackageJson(appPackage);
};

const installWebAppDependencies = (appPath) => {
  spawn.sync(
    'npm',
    ['install', 'react@17', 'react-dom@17', '@sitevision/api'],
    {
      stdio: 'inherit',
      cwd: appPath,
    }
  );
};

const installRestAppDependencies = (appPath) => {
  spawn.sync('npm', ['install', '@sitevision/api'], {
    stdio: 'inherit',
    cwd: appPath,
  });
};

const updatePackageJsonLegacy = (transpile) => {
  const appPackage = getCommonPackageProperties();

  appPackage.sitevision_scripts_properties = {
    transpile,
  };

  writePackageJson(appPackage);
};

const simplifyVersionNumber = (rawVersion) =>
  rawVersion
    .match(/(\d+)\.(\d+)\.(\d+)-?([a-zA-Z-\d.]*)\+?([a-zA-Z-\d.]*)/)
    .splice(1, 3)
    .join('.');

export default async ({ appPath, appName }) => {
  console.clear();

  inquirer
    .prompt(questions)
    .then(
      ({
        type,
        transpile,
        domain,
        siteName,
        addonName,
        username,
        password,
        typescript,
      }) => {
        console.clear();

        fs.writeFileSync(
          path.resolve(appPath, properties.DEV_PROPERTIES_PATH),
          JSON.stringify(
            { domain, siteName, addonName, username, password },
            null,
            2
          )
        );

        type = typescript ? `${type}-typescript` : type;

        console.log(`Initializing Sitevision ${type} app`, appName);
        const templateOptions = {
          appName,
        };

        switch (type) {
          case 'web-react':
          case 'web-react-typescript': {
            updatePackageJsonReact(typescript);
            installWebAppDependencies(appPath);
            templateOptions.reactVersion = simplifyVersionNumber(
              properties.getPackageJson().dependencies.react
            );
            break;
          }
          case 'rest-bundled':
          case 'rest-bundled-typescript': {
            updatePackageJsonBundledRest(typescript);
            installRestAppDependencies(appPath);
            break;
          }
          default:
            updatePackageJsonLegacy(transpile);
        }

        copyTemplateFiles(type, templateOptions);

        console.log(
          'Your app has been created just',
          chalk.blue(`cd ${appName}`)
        );
      }
    );
};
