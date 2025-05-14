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

router.get('/getAllInvoices', async (req, res) => {
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
        conn.query("select invoices.*,customers.title as customer_title from invoices join customers on invoices.customer_accounting_code=customers.accounting_code", (err, result) => {
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

router.post('/getCustomersInvoices', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return false;
    }
    if (!req.body.accounting_code) {
        res.json({
            success: false,
            message: "کد حسابداری ضروری است"
        })
        return false;
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const accounting_code = req.body.accounting_code;

    jwt.verify(token, secretKey, (err, result) => {
        conn.query(`select * from invoices where customer_accounting_code = ${accounting_code}`, (err, result) => {
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

router.post('/getCustomersInvoicesTotalAmount', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return false;
    }
    if (!req.body.accounting_code) {
        res.json({
            success: false,
            message: "کد حسابداری ضروری است"
        })
        return false;
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const accounting_code = req.body.accounting_code;

    jwt.verify(token, secretKey, (err, result) => {
        conn.query(`select sum(total_amount)as total_amounts_invoices from invoices where customer_accounting_code = ${accounting_code}`, (err, result) => {
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

router.post('/updateInvoicesList', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return false;
    }

    if (!req.body.invoicesList) {
        res.json({
            success: false,
            message: "فایل انتخاب نشده است"
        })
        return false;
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const invoicesList = req.body.invoicesList;

    jwt.verify(token, secretKey, (err, result) => {
        if (err) {
            res.json({
                success: false,
                message: err
            });
            return false;
        }

        const mappedInvoices = invoicesList
            .filter((c) => c['شماره'])
            .map((c) => ([
                c["شماره"] || 0,
                c["شماره دوم"] || 0,
                c["تاریخ"] || null,
                c["کد مشتری"] || null,
                c["مبلغ "] || null,
                c["تخفیف"] || 0,
                c["کسورات/اضافات"] || 0,
                c["قیمت کل"] || null,
                c["وضعیت"] || null,
                c["توضیحات"] || null,
                c["نوع"] || null
            ]));



        conn.query("DELETE FROM invoices", (err, result) => {
            if (err) {
                res.json({
                    success: false,
                    message: "مشکلی پیش آمده است، لطفا مجددا تلاش کنید"
                });
                return false;
            }
        })

        const insertQuery = `
        INSERT INTO invoices (
            invoice_number, invoice_number_2,invoice_date,customer_accounting_code, amount, discount,
            deductions, total_amount,status,description,type
        ) VALUES ?
        ON DUPLICATE KEY UPDATE
            invoice_number_2= VALUES(invoice_number_2),
            invoice_date = VALUES(invoice_date),
            customer_accounting_code = VALUES(customer_accounting_code),
            amount = VALUES(amount),
            discount = VALUES(discount),
            deductions = VALUES(deductions),
            total_amount = VALUES(total_amount),
            status = VALUES(status),
            description = VALUES(description),
            type = VALUES(type)
        `;

        conn.query(insertQuery, [mappedInvoices], (err, result) => {
            if (err) {
                return res.json({
                    success: false,
                    message: err
                });
            }

            res.json({
                success: true,
                message: `بروزرسانی لیست سفارشات با موفقیت انجام شد`
            });
        });


    })

})

export default router;