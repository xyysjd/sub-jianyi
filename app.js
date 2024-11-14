const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const app = express();

// CORS配置
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.options('*', cors());

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 限制每个IP 15分钟内100次请求
});

app.use(limiter);

// 添加静态文件服务
app.use(express.static(__dirname));

// 添加根路由服务
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 配置
const CONFIG = {
    uploadDir: 'uploads',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    fileRetentionMs: 3600000, // 1小时
    secretKey: process.env.SECRET_KEY || 'your-secret-key-change-me'
};

// 确保上传目录存在
if (!fs.existsSync(CONFIG.uploadDir)) {
    fs.mkdirSync(CONFIG.uploadDir, { recursive: true });
}

// 文件访问令牌存储
const fileTokens = new Map();

// 生成访问令牌
function generateFileToken(filename) {
    const token = crypto.randomBytes(32).toString('hex');
    fileTokens.set(token, {
        filename,
        createdAt: Date.now()
    });
    return token;
}

// 验证令牌中间件
function verifyFileToken(req, res, next) {
    const { token } = req.query;
    const fileInfo = fileTokens.get(token);
    
    if (!fileInfo || Date.now() - fileInfo.createdAt > CONFIG.fileRetentionMs) {
        fileTokens.delete(token);
        return res.status(403).json({ error: '访问令牌无效或已过期' });
    }
    
    if (fileInfo.filename !== req.params.filename) {
        return res.status(403).json({ error: '访问令牌与文件不匹配' });
    }
    
    next();
}

// 生成安全的文件名
function generateSecureFilename() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHmac('sha256', CONFIG.secretKey)
        .update(`${timestamp}${random}`)
        .digest('hex');
    return `${timestamp}-${hash}.txt`;
}

// 配置文件存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, CONFIG.uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, generateSecureFilename());
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: CONFIG.maxFileSize
    }
});

// 文件下载路由
app.get('/uploads/:filename', verifyFileToken, (req, res) => {
    const filePath = path.join(__dirname, CONFIG.uploadDir, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: '文件不存在' });
    }

    // 防止目录遍历
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(path.join(__dirname, CONFIG.uploadDir))) {
        return res.status(403).json({ error: '访问被拒绝' });
    }

    res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${req.params.filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'X-Content-Type-Options': 'nosniff'
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
        console.error('文件流错误:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: '文件读取错误' });
        }
    });
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

        // 生成访问令牌
        const token = generateFileToken(req.file.filename);
        
        // 构建带令牌的URL
        const rawUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}?token=${token}`;
        
        res.json({
            success: true,
            rawUrl: rawUrl
        });
    } catch (error) {
        console.error('上传错误:', error);
        res.status(500).json({
            success: false,
            error: '上传失败'
        });
    }
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: '文件大小超出限制(5MB)'
            });
        }
    }
    res.status(500).json({
        success: false,
        error: '服务器内部错误'
    });
});

// 定期清理文件和令牌
setInterval(() => {
    // 清理文件
    fs.readdir(CONFIG.uploadDir, (err, files) => {
        if (err) return console.error('清理文件时出错:', err);
        
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(CONFIG.uploadDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return console.error('获取文件信息失败:', err);
                
                if (now - stats.mtimeMs > CONFIG.fileRetentionMs) {
                    fs.unlink(filePath, err => {
                        if (err) console.error('删除文件失败:', err);
                    });
                }
            });
        });
    });

    // 清理过期令牌
    const now = Date.now();
    for (const [token, fileInfo] of fileTokens.entries()) {
        if (now - fileInfo.createdAt > CONFIG.fileRetentionMs) {
            fileTokens.delete(token);
        }
    }
}, 300000); // 每5分钟清理一次

// 启动服务器
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`服务器运行在 http://0.0.0.0:${port}`);
});