require("dotenv").config();
const express = require("express");
const mysql = require("mysql");

const app = express();
//*Create Database Connection

const db = mysql.createConnection({
	host: process.env.DB_HOST,
	port: process.env.DB_HOST_PORT,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

//*Connect to Database

db.connect((err) => {
	if (err) {
		console.log(err);
	} else {
		app.listen(process.env.PORT || "3535", () => {
			console.log("Server running");
		});
		console.log("Application successfully connected to cms_db");
	}
});

//*Routes

const loginRoutes = require("./routes/login");
app.use("/login", loginRoutes(db));
