//* PACKAGE IMPORTS
require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cookieParser = require("cookie-parser");

//* ROUTE IMPORTS
const accountRoutes = require("./routes/accountRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const curriculumRoutes = require("./routes/curriculumRoutes");

const app = express();

//* DATABASE POOL

const pool = mysql.createPool({
	connectionLimit: 10,
	host: process.env.DB_HOST,
	port: process.env.DB_HOST_PORT,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

//* CONNECT TO DATABASE POOL

// pool.getConnection((err, connection) => {
// 	if (err) {
// 		console.log(err);
// 	} else {
// 		connection.release();
// 		app.listen(process.env.PORT || "3535", process.env.HOST, () => {
// 			console.log(`Server running on port ${process.env.PORT || "3535"}`);
// 		});
// 		console.log("Application successfully connected to cms_db");
// 	}
// });
app.listen(process.env.PORT || "3535", process.env.HOST, () => {
	console.log(`Server running on port ${process.env.PORT || "3535"}`);
});

app.use(express.json());
app.use(cookieParser());

//* ROUTES

app.get("/test", (req, res) => {
	res.send(
		`Test successful! Server running on port ${process.env.PORT || "3535"}`
	);
});

app.use("/account", accountRoutes);
app.use("/subject", subjectRoutes);
app.use("/curriculum", curriculumRoutes);
