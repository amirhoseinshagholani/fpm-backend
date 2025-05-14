import express from "express";
import jwt, { decode } from 'jsonwebtoken';
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const secretKey = process.env.JWT_SECRET;

const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})
conn.connect();

router.get('/getAllRoles', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return;
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    jwt.verify(token, secretKey, (err, result) => {
        if (err) {
            return res.json({
                success: false,
                message: "توکن نامعتبر است"
            });
        }

        const query = `select * from roles`;

        conn.query(query, (err, result) => {
            if (err) {
                res.json({
                    success: false,
                    message: err
                });
                return;
            }

            res.json({
                success: true,
                data: result
            });
        });
    });
});

router.post('/addRole', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return;
    }

    if (!req.body.roleTitle) {
        res.json({
            success: false,
            message: "عنوان نقش را وارد کنید"
        });
        return;
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    jwt.verify(token, secretKey, (err, result) => {
        if (err) {
            res.json({
                success: false,
                message: err
            });
            return;
        }

        const insertQuery = 'INSERT INTO roles(title,status,description)VALUES ?'
        const values = [[req.body.roleTitle, req.body.roleStatus, req.body.roleDescription]];

        conn.query(insertQuery, [values], (err, result) => {
            if (err) {
                return res.json({
                    success: false,
                    message: err
                });
            }

            res.json({
                success: true,
                message: `ثبت نقش با موفقیت انجام شد`
            });
        });


    });
});


export default router;