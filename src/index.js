require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cookieParser = require("cookie-parser");

const app = express();
//*Create Database Connection Pool

const pool = mysql.createPool({
	connectionLimit: 10,
	host: process.env.DB_HOST,
	port: process.env.DB_HOST_PORT,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

//*Connect to Database Pool

pool.getConnection((err, connection) => {
	if (err) {
		console.log(err);
	} else {
		connection.release();
		app.listen(process.env.PORT || "3535", () => {
			console.log(`Server running on port ${process.env.PORT || "3535"}`);
		});
		console.log("Application successfully connected to cms_db");
	}
});

//*Routes

app.get("/test", (req, res) => {
	res.send(
		`Test successful! Server running on port ${process.env.PORT || "3535"}`
	);

	// bcrypt.genSalt(10, (err, salt) => {
	// 	bcrypt.hash("cictadmin", salt, (err, hash) => {
	// 		console.log(hash);
	// 	});
	// });
});

const accountRoutes = require("./routes/accountRoutes");
app.use(express.json());
app.use(cookieParser());
app.use("/account", accountRoutes);
