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

router.get('/test', async (req, res) => {
	res.json({data:"this is test"});
});

router.get('/getAllUsers', async (req, res) => {
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

        const query = `select users.*,roles.title as role_title from users join roles on users.role_id=roles.id `;

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

router.post('/addUser', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return;
    }

    if (!req.body.role_id) {
        res.json({
            success: false,
            message: "نقش را وارد کنید"
        });
        return;
    }

    if (!req.body.name) {
        res.json({
            success: false,
            message: "نام کاربر را وارد کنید"
        });
        return;
    }

    if (!req.body.last_name) {
        res.json({
            success: false,
            message: "نام خانوادگی را وارد کنید"
        });
        return;
    }

    if (!req.body.username) {
        res.json({
            success: false,
            message: "نام کاربری را وارد کنید"
        });
        return;
    }

    if (!req.body.password) {
        res.json({
            success: false,
            message: "رمزعبور را وارد کنید"
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

        const insertQuery = 'INSERT INTO users(role_id,name,last_name,status,mobile,username,password,description)VALUES ?'
        const values =
            [[
                req.body.role_id,
                req.body.name,
                req.body.last_name,
                req.body.status,
                req.body.mobile,
                req.body.username,
                req.body.password,
                req.body.description
            ]];

        conn.query(insertQuery, [values], (err, result) => {
            if (err) {
                return res.json({
                    success: false,
                    message: err
                });
            }

            res.json({
                success: true,
                message: `ثبت کاربر با موفقیت انجام شد`
            });
        });


    });
});


export default router;