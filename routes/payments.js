import express from "express";
import jwt, { decode } from 'jsonwebtoken';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import { getToday } from "../assets/functions.js";

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

router.post('/getCustomersInvoicesTotalPayment', async (req, res) => {
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
        conn.query(`select IFNULL(sum(amount),0)as total_payments from payments WHERE customer_accounting_code=${accounting_code} and status='2'`, (err, result) => {
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

router.get('/getInvoicesTotalPayment', async (req, res) => {
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
        conn.query(`select IFNULL(sum(amount),0)as total_payments from payments WHERE status='2'`, (err, result) => {
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

router.post('/getCustomersInvoicesPayment', async (req, res) => {
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

    if (accounting_code == "00") {
        jwt.verify(token, secretKey, (err, result2) => {
            conn.query(`select * from payments order by id desc`, (err, result) => {
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
    } else {
        jwt.verify(token, secretKey, (err, result2) => {
            conn.query(`select * from payments WHERE customer_accounting_code=${accounting_code} order by id desc`, (err, result) => {
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
    }

});

router.get('/getCountPayments', async (req, res) => {
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
        conn.query(`select count(*) as countPayments from payments where status=2`, (err, result) => {
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

router.get("/getPayment", (req, res) => {
    const key = req.query.key;
    const tracking_code = req.query.tracking_code;

    if (!key) {
        return res.status(400).json("key is null!");
    }

    if (key != '123456abcabc') {
        return res.status(400).json("key is wrong!");
    }

    if (!tracking_code) {
        return res.status(400).json("tracking_code is null!");
    }
    conn.query(`select * from payments where tracking_code=${tracking_code}`, (err, result) => {
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

router.post("/updatePaymentToken", async (req, res) => {
    const tracking_code = req.body.tracking_code;
    const token = req.body.token;

    if (!tracking_code) {
        return res.json({ success: false, message: "Tracking Code is required" });
    }
    if (!token) {
        return res.json({ success: false, message: "Token is required" });
    }

    const today = getToday();
    
    const updateQuery = `UPDATE payments SET token = ?, updated_at = ? WHERE tracking_code = ?`;
    const updateValues = [token, today, tracking_code];

    try {
        conn.query(updateQuery, updateValues, async (err, result) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, message: "خطا در بروزرسانی توکن پرداخت" });
            }
            res.json({ success: true, message: "توکن پرداخت با موفقیت به روز شد" });
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "بروزرسانی انجام نشد، لطفا مجدد امتحان کنید" });
    }
});

router.post("/callback", async (req, res) => {

    const tracking_code = req.body.tracking_code;

    if (!tracking_code) {
        return res.json({ success: false, message: "tracking_code is required" });
    }

    const today = getToday();
    const updateQuery = `UPDATE payments SET status = '2', updated_at = ? WHERE tracking_code = ?`;
    const updateValues = [today, tracking_code];

    try {
        conn.query(updateQuery, updateValues, async (err, result) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, message: "خطا در بروزرسانی وضعیت پرداخت" });
            }
            res.json({ success: true, message: "وضعیت پرداخت با موفقیت به روز شد" });
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "بروزرسانی انجام نشد، لطفا مجدد امتحان کنید" });
    }
});

export default router;