const localconfig = require('../../.localconfig');

Cypress.on('uncaught:exception', (err, runnable) => {
  // if the error message matches the one about WorkerGlobalScope importScripts
  if (err.message.includes("Failed to execute 'importScripts' on 'WorkerGlobalScope'")) {
    // return false to let Cypress know we intentionally want to ignore this error
    return false;
  }
  // otherwise let Cypress throw the error
});

beforeEach(() => {
  cy.visit('http://localhost:3000');
  cy.viewport(1250, 900);
});

function multiTest(testName, testDefinition) {
  if (localconfig.mysql) {
    it(testName + ' MySQL', () => testDefinition('MySql-connection'));
  }
  if (localconfig.postgres) {
    it(testName + ' Postgres', () => testDefinition('Postgres-connection'));
  }
  if (localconfig.mssql) {
    it(testName + ' Mssql', () => testDefinition('Mssql-connection'));
  }
  if (localconfig.oracle) {
    it(testName + ' Oracle', () => testDefinition('Oracle-connection', 'C##MY_GUITAR_SHOP'));
  }
}

describe('Mutli-sql tests', () => {
  multiTest('Transactions', (connectionName, databaseName = 'my_guitar_shop') => {
    cy.contains(connectionName).click();
    cy.contains(databaseName).click();
    cy.testid('TabsPanel_buttonNewQuery').click();
    cy.wait(1000);
    cy.get('body').type("INSERT INTO categories (category_id, category_name) VALUES (5, 'test');");

    // rollback
    cy.testid('QueryTab_beginTransactionButton').click();
    cy.contains('Begin Transaction finished');
    cy.testid('QueryTab_executeButton').click();
    cy.contains('Query execution finished');
    cy.testid('QueryTab_rollbackTransactionButton').click();
    cy.contains('Rollback Transaction finished');

    // should contain 4 rows
    cy.testid('SqlObjectList_container').contains('categories').click();
    cy.contains('Guitars').click();
    cy.testid('TableDataTab_refreshGrid').click();
    cy.contains('Rows: 4');

    // commit
    cy.contains('Query #1').click();
    cy.testid('QueryTab_beginTransactionButton').click();
    cy.contains('Begin Transaction finished');
    cy.testid('QueryTab_executeButton').click();
    cy.contains('Query execution finished');
    cy.testid('QueryTab_commitTransactionButton').click();
    cy.contains('Commit Transaction finished');

    // should contain 5 rows
    cy.testid('SqlObjectList_container').contains('categories').click();
    cy.contains('Guitars').click();
    cy.testid('TableDataTab_refreshGrid').click();
    cy.contains('Rows: 5');
  });
});
