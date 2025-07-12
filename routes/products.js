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

router.get('/getAllProducts', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return false;
    }
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    jwt.verify(token, secretKey, (err, result) => {
        conn.query("SELECT * FROM products order by id desc", (err, result) => {
            if (err) {
                res.json({
                    success: false,
                    message: err
                });
                return false;
            }
            res.json({
                success: true,
                data: result
            })
        })
    });
});

router.post('/updateProductsList', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return false;
    }

    if (!req.body.productsList) {
        res.json({
            success: false,
            message: "فایل انتخاب نشده است"
        })
        return false;
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const productsList = req.body.productsList;

    jwt.verify(token, secretKey, (err, result) => {
        if (err) {
            res.json({
                success: false,
                message: err
            });
            return false;
        }

        const mappedProducts = productsList
        .filter((c) => c['کد جنس']) // فقط اون‌هایی که کد جنس دارند
        .map((c) => ([
            c["کد جنس"] || null,
            c["شرح جنس"] || "",
            c["قیمت فروش"] || null,
            c["موجودی کل تعداد"] || null,
            c["بارکد"] || null,
            c["کد فنی"] || ""
        ]));
    


        conn.query("DELETE FROM products", (err, result) => {
            if (err) {
                res.json({
                    success: false,
                    message: "مشکلی پیش آمده است، لطفا مجددا تلاش کنید"
                });
                return false;
            }
        })

        const insertQuery = `
        INSERT INTO products (
            accounting_code, title, price, inventory,
            barcode, technical_code
        ) VALUES ?
        ON DUPLICATE KEY UPDATE
            title= VALUES(title),
            price = VALUES(price),
            inventory = VALUES(inventory),
            barcode = VALUES(barcode),
            technical_code = VALUES(technical_code)
        `;

        conn.query(insertQuery, [mappedProducts], (err, result) => {
            if (err) {
                return res.json({
                    success: false,
                    message: err
                });
            }

            res.json({
                success: true,
                message: `بروزرسانی لیست محصولات با موفقیت انجام شد`
            });
        });


    })

})

export default router;