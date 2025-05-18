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

router.get('/getAllCustomers', async (req, res) => {
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

        const query = `
            SELECT 
                c.*, 
                up.username AS username, 
                up.password AS password
            FROM customers c
            LEFT JOIN customers_user_pass up 
            ON c.accounting_code = up.accounting_code
        `;

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

router.post('/updateCustomerList', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return;
    }

    if (!req.body.customerList) {
        res.json({
            success: false,
            message: "فایل انتخاب نشده است"
        });
        return;
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const customerList = req.body.customerList;

    jwt.verify(token, secretKey, (err, result) => {
        if (err) {
            res.json({
                success: false,
                message: err
            });
            return;
        }

        // تبدیل داده‌ها به آرایه
        const mappedCustomers = customerList.map((c) => {
            const accountingCode = c["کد حسابداری"] || "";
            const codeStr = String(accountingCode);
            // const username = codeStr + codeStr.substring(0, 5);

            return [
                accountingCode,
                c["عنوان"] || "",
                c["نام"] || "",
                c["نام خانوادگی"] || "",
                c["تلگرام/واتس آپ"] || null,
                c["تلفن"] || null,
                c["استان"] || "",
                c["شهر"] || "",
                c["آدرس"] || "",
                c["توضیحات"] || "",
                c["بازاریاب"] || ""
            ];
        });

        const allAccountingCodes = mappedCustomers.map(c => c[0]);
        const placeholders = allAccountingCodes.map(() => '?').join(',');

        const selectQuery = `SELECT accounting_code FROM customers_user_pass WHERE accounting_code IN (${placeholders})`;

        conn.query(selectQuery, allAccountingCodes, (err, existingRows) => {
            if (err) {
                return res.json({
                    success: false,
                    message: "خطا در بررسی یوزرها"
                });
            }

            const existingCodes = existingRows.map(r => r.accounting_code);

            const newUsers = mappedCustomers.filter(c => !existingCodes.includes(c[0]));

            const userPassValues = newUsers.map(c => {
                const accountingCode = String(c[0]);
                const username = accountingCode + accountingCode.substring(0, 5);
                const password = Math.floor(100000 + Math.random() * 900000).toString(); // رمز 6 رقمی رندوم
                return [accountingCode, username, password];
            });

            if (userPassValues.length > 0) {
                const userPassQuery = `
                    INSERT INTO customers_user_pass (accounting_code, username, password)
                    VALUES ?
                `;

                conn.query(userPassQuery, [userPassValues], (err, result) => {
                    if (err) {
                        return res.json({
                            success: false,
                            message: "خطا در درج یوزرنیم و پسوردها"
                        });
                    }

                    insertCustomers();
                });
            } else {
                insertCustomers();
            }
        });

        // تابع درج مشتریان در جدول اصلی
        function insertCustomers() {
            conn.query("DELETE FROM customers", (err, result) => {
                if (err) {
                    res.json({
                        success: false,
                        message: "مشکلی در حذف جدول قبلی پیش آمده است"
                    });
                    return;
                }

                const insertQuery = `
                    INSERT INTO customers (
                        accounting_code, title, name, last_name,
                        mobile, tell, province, city,
                        address, description, marketer
                    ) VALUES ?
                    ON DUPLICATE KEY UPDATE
                        title = VALUES(title),
                        name = VALUES(name),
                        last_name = VALUES(last_name),
                        tell = VALUES(tell),
                        province = VALUES(province),
                        city = VALUES(city),
                        address = VALUES(address),
                        description = VALUES(description),
                        marketer = VALUES(marketer);
                `;

                conn.query(insertQuery, [mappedCustomers], (err, result) => {
                    if (err) {
                        return res.json({
                            success: false,
                            message: err
                        });
                    }

                    res.json({
                        success: true,
                        message: `بروزرسانی لیست مشتریان با موفقیت انجام شد`
                    });
                });
            });
        }
    });
});


export default router;