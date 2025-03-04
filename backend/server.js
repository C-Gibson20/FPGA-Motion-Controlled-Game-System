require("dotenv").config(); // environment variables
const express = require("express"); // http requests
const {Pool} = require("pg"); // Postgres
const cors = require("cors"); // Allows frontend to communicate w/ backend

const app = express();

app.use(express.json());

app.use(cors());

// Loads .env variables
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,
    },
});

app.get("/", (req, res) => {
    res.send("API is running");
});

app.get("/users", async (req, res) => {
    try{
        const result = await pool.query("SELECT * FROM testscores");
        res.json(result.rows);
    } catch (err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

const PORT = 5001;
app.listen(PORT, () => {
    console.log("Server running on port 5001")
});
