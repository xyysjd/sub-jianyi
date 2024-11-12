const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();

// 配置 CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.options('*', cors());

// 设置静态文件目录为当前目录
app.use(express.static(__dirname));

// 确保上传目录存在
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, uniqueSuffix + '.txt');
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// 文件上传接口
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '没有文件上传'
            });
        }
        
        const rawUrl = `http://${req.get('host')}/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            rawUrl: rawUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: '上传失败'
        });
    }
});

// 定期清理文件（每小时）
setInterval(() => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return console.error('清理文件时出错:', err);
        
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(uploadDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return console.error('获取文件信息失败:', err);
                
                if (now - stats.mtimeMs > 3600000) {
                    fs.unlink(filePath, err => {
                        if (err) console.error('删除文件失败:', err);
                    });
                }
            });
        });
    });
}, 3600000);

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`服务器运行在 http://0.0.0.0:${port}`);
});
