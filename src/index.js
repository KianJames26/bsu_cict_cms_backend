const express = require("express");
const mysql = require("mysql");

const app = express();
//!Create Database Connection

const db = mysql.createConnection({
	host: "sql12.freesqldatabase.com",
	port: "3306",
	user: "sql12609253",
	password: "XarQS5eM1u",
	database: "sql12609253",
});

//!Connect

db.connect((err) => {
	if (err) {
		console.log(err);
	} else {
		app.listen("3535", () => {
			console.log("Server running on port 3535");
		});
		console.log("Application successfully connected to cms_db");
	}
});

app.get("/", (req, res) => {
	res.send("Homepage");
});

app.get("/createTable", async (req, res) => {
	try {
		// Define SQL query to create table
		const createTableQuery = `CREATE TABLE IF NOT EXISTS user_management (
      id INT(11) NOT NULL AUTO_INCREMENT,
      username VARCHAR(50) NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(50) NOT NULL,
      role VARCHAR(20) NOT NULL,
      status ENUM('active', 'inactive') NOT NULL,
      PRIMARY KEY (id)
    )`;

		// Execute query and handle response
		db.query(createTableQuery, (err, result, fields) => {
			if (err) {
				console.error(err);
				res.status(500).send(err);
			} else {
				console.log(result);
				res.send(result);
			}
		});
	} catch (err) {
		console.error(err);
		res.status(500).send(err);
	}
});
