//* PACKAGE IMPORTS
require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cookieParser = require("cookie-parser");
const expressUploader = require("express-fileupload");

//* ROUTE IMPORTS
const accountRoutes = require("./routes/accountRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const curriculumRoutes = require("./routes/curriculumRoutes");
const curriculumSubjectRoutes = require("./routes/curriculumSubjectRoutes");

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

pool.getConnection((err, connection) => {
	if (err) {
		console.log(err);
	} else {
		connection.release();
		app.listen(process.env.PORT || "3535", process.env.HOST, () => {
			console.log(`Server running on port ${process.env.PORT || "3535"}`);
		});
		console.log("Application successfully connected to cms_db");
	}
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(expressUploader());

//* ROUTES

app.get("/test", (req, res) => {
	res.send(
		`Test successful! Server running on port ${process.env.PORT || "3535"}`
	);
});
app.post("/test", (req, res) => {
	pool.query("select * from prerequisites", (error, result) => {
		if (error) {
			return res.status(500).json({ error: "Internal server error" });
		} else {
			return res.status(200).json(result);
		}
	});
});

app.use("/account", accountRoutes);
app.use("/subject", subjectRoutes);
app.use("/curriculum", curriculumRoutes);
app.use("/curriculum-subject", curriculumSubjectRoutes);
