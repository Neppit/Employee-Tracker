const inquirer = require('inquirer');
const { Pool } = require('pg');

// Create a PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'employee_db',
  password: 'postgres',
  port: 5432,
});

// Start the application
function startApp() {
  inquirer.prompt({
    name: 'action',
    type: 'list',
    message: 'What would you like to do?',
    choices: [
      'View all departments',
      'View all roles',
      'View all employees',
      'Add a department',
      'Add a role',
      'Add an employee',
      'Update an employee role',
      'Exit'
    ]
  }).then((answer) => {
    switch (answer.action) {
      case 'View all departments':
        viewAllDepartments();
        break;
      case 'View all roles':
        viewAllRoles();
        break;
      case 'View all employees':
        viewAllEmployees();
        break;
      case 'Add a department':
        addDepartment();
        break;
      case 'Add a role':
        addRole();
        break;
      case 'Add an employee':
        addEmployee();
        break;
      case 'Update an employee role':
        updateEmployeeRole();
        break;
      case 'Exit':
        pool.end();
        console.log('Goodbye!');
        break;
    }
  });
}

// Function to view all departments
function viewAllDepartments() {
  pool.query('SELECT * FROM departments', (err, res) => {
    if (err) throw err;
    console.table(res.rows);
    startApp();
  });
}

// Function to view all roles
function viewAllRoles() {
  pool.query('SELECT * FROM roles', (err, res) => {
    if (err) throw err;
    console.table(res.rows);
    startApp();
  });
}

// Function to view all employees
function viewAllEmployees() {
  pool.query('SELECT * FROM employees', (err, res) => {
    if (err) throw err;
    console.table(res.rows);
    startApp();
  });
}

// Function to add a department
function addDepartment() {
  inquirer.prompt({
    name: 'name',
    type: 'input',
    message: 'Enter the name of the department:'
  }).then((answer) => {
    pool.query('INSERT INTO departments (name) VALUES ($1)', [answer.name], (err, res) => {
      if (err) throw err;
      console.log('Department added successfully!');
      startApp();
    });
  });
}

// Function to add a role
function addRole() {
  // Fetch existing departments
  pool.query('SELECT * FROM departments', (err, res) => {
    if (err) throw err;

    inquirer.prompt([
      {
        name: 'title',
        type: 'input',
        message: 'Enter the title of the role:'
      },
      {
        name: 'salary',
        type: 'input',
        message: 'Enter the salary for this role:'
      },
      {
        name: 'department',
        type: 'list',
        message: 'Select the department for this role:',
        choices: res.rows.map(row => row.name)
      }
    ]).then((answers) => {
      // Find the department id based on the selected department name
      const departmentId = res.rows.find(row => row.name === answers.department).id;

      pool.query('INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)', [answers.title, answers.salary, departmentId], (err, res) => {
        if (err) throw err;
        console.log('Role added successfully!');
        startApp();
      });
    });
  });
}

// Function to add an employee
function addEmployee() {
  // Fetch existing roles and employees
  pool.query('SELECT * FROM roles', (err, roles) => {
    if (err) throw err;

    pool.query('SELECT * FROM employees', (err, employees) => {
      if (err) throw err;

      inquirer.prompt([
        {
          name: 'firstName',
          type: 'input',
          message: "Enter the employee's first name:"
        },
        {
          name: 'lastName',
          type: 'input',
          message: "Enter the employee's last name:"
        },
        {
          name: 'role',
          type: 'list',
          message: "Select the employee's role:",
          choices: roles.rows.map(row => row.title)
        },
        {
          name: 'manager',
          type: 'list',
          message: "Select the employee's manager:",
          choices: ['None'].concat(employees.rows.map(row => `${row.first_name} ${row.last_name}`))
        }
      ]).then((answers) => {
        // Find the role id based on the selected role title
        const roleId = roles.rows.find(row => row.title === answers.role).id;

        // Find the manager id based on the selected manager name
        let managerId = null;
        if (answers.manager !== 'None') {
          const [firstName, lastName] = answers.manager.split(' ');
          const manager = employees.rows.find(row => row.first_name === firstName && row.last_name === lastName);
          managerId = manager.id;
        }

        pool.query('INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', [answers.firstName, answers.lastName, roleId, managerId], (err, res) => {
          if (err) throw err;
          console.log('Employee added successfully!');
          startApp();
        });
      });
    });
  });
}

// Function to update an employee role
function updateEmployeeRole() {
  // Fetch existing employees and roles
  pool.query('SELECT * FROM employees', (err, employees) => {
    if (err) throw err;

    pool.query('SELECT * FROM roles', (err, roles) => {
      if (err) throw err;

      inquirer.prompt([
        {
          name: 'employee',
          type: 'list',
          message: 'Select the employee to update:',
          choices: employees.rows.map(row => `${row.first_name} ${row.last_name}`)
        },
        {
          name: 'role',
          type: 'list',
          message: 'Select the new role for the employee:',
          choices: roles.rows.map(row => row.title)
        }
      ]).then((answers) => {
        // Find the employee id based on the selected employee name
        const [firstName, lastName] = answers.employee.split(' ');
        const employee = employees.rows.find(row => row.first_name === firstName && row.last_name === lastName);
        const employeeId = employee.id;

        // Find the role id based on the selected role title
        const roleId = roles.rows.find(row => row.title === answers.role).id;

        pool.query('UPDATE employees SET role_id = $1 WHERE id = $2', [roleId, employeeId], (err, res) => {
          if (err) throw err;
          console.log('Employee role updated successfully!');
          startApp();
        });
      });
    });
  });
}

// Initialize the application
startApp();