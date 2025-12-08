/**
 * PDF转换控制器
 * 处理PDF文件转换为Markdown格式的功能
 */
const pdf2md = require('@opendocsg/pdf2md');
const { AppError } = require('../middlewares/errorHandler');
const fs = require('fs');
const path = require('path');

/**
 * 增强PDF转换结果的处理函数
 * 1. 改进表格格式
 * 2. 删除多余的换行符
 * 3. 移除######
 */
const enhanceMarkdownContent = (markdown) => {
  if (!markdown) return '';
  
  let enhanced = markdown;
  
  // 处理表格 - 改进表格格式，确保表头和分隔线正确对齐
  enhanced = processTables(enhanced);
  
  // 删除多余的换行符（三个或更多），保留两个作为段落分隔
  enhanced = enhanced.replace(/\n{2,}/g, '\n');
  
  // 移除######（六个井号的标题）
  enhanced = enhanced.replace(/^######\s+/gm, '');
  
  return enhanced;
};

/**
 * 处理Markdown中的表格
 */
const processTables = (markdown) => {
  // 简单的表格处理：识别表格结构并确保格式正确
  // 查找表格的基本模式：包含|分隔符的行
  const tableRegex = /(?:^|\n)(\|.*?\|(?:\n|$))+(?=\n|$)/g;
  
  return markdown.replace(tableRegex, (table) => {
    // 分割表格的每一行
    const lines = table.trim().split('\n');
    
    // 如果表格至少有两行（表头和分隔线）
    if (lines.length >= 2) {
      // 确保表头和分隔线正确
      const headerLine = lines[0];
      
      // 如果第二行不是分隔线，添加一个
      if (!lines[1].match(/^\|[-\s|:]+\|$/)) {
        // 从表头创建分隔线
        const separatorLine = headerLine.replace(/\|/g, '').replace(/[^\s]/g, '-');
        lines.splice(1, 0, '|' + separatorLine + '|');
      }
      
      // 合并单元格内容中的多余空格
      return '\n' + lines.map(line => 
        line.replace(/\|\s+/g, '| ').replace(/\s+\|/g, ' |').replace(/\s{2,}/g, ' ')
      ).join('\n') + '\n';
    }
    
    return table;
  });
};

/**
 * 将PDF文件转换为Markdown格式
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const convertPdfToMarkdown = async (req, res, next) => {
  try {
    // 检查是否有文件上传
    if (!req.files || !req.files.pdfFile) {
      return next(new AppError(400, '请上传PDF文件'));
    }

    const pdfFile = req.files.pdfFile;
    
    // 解码原始文件名（解决中文乱码问题）
    const originalFileName = Buffer.from(pdfFile.name, 'latin1').toString('utf8');
    
    // 检查文件类型
    const fileExtension = path.extname(originalFileName).toLowerCase();
    if (fileExtension !== '.pdf') {
      return next(new AppError(400, '请上传PDF格式的文件'));
    }

    // 由于fileUpload中间件配置为useTempFiles: false，文件数据在内存中
    // 我们需要创建临时文件路径来处理PDF
    console.log('开始处理上传的PDF文件:', originalFileName);
    
    // 使用更简单的临时文件名格式
    const tempFileName = `pdf_${Date.now()}.pdf`;
    // 直接使用当前工作目录下的temp文件夹，避免路径权限问题
    const tempDir = path.join(process.cwd(), 'temp');
    const tempFilePath = path.join(tempDir, tempFileName);
    
    console.log('临时文件路径:', tempFilePath);
    
    // 确保临时目录存在
    try {
      if (!fs.existsSync(tempDir)) {
        console.log('创建临时目录:', tempDir);
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('临时目录创建成功');
      } else {
        console.log('临时目录已存在:', tempDir);
      }
    } catch (mkdirError) {
      console.error('创建临时目录失败:', mkdirError);
      return next(new AppError(500, '创建临时目录失败，无法处理文件'));
    }

    // 保存文件到临时目录
    try {
      console.log('正在保存文件到临时路径...');
      await pdfFile.mv(tempFilePath);
      // 验证文件是否成功保存
      if (fs.existsSync(tempFilePath)) {
        const stats = fs.statSync(tempFilePath);
        console.log('文件保存成功，文件大小:', stats.size, '字节');
      } else {
        console.error('文件保存后不存在');
        return next(new AppError(500, '文件保存失败，临时文件不存在'));
      }
    } catch (saveError) {
      console.error('保存文件失败:', saveError);
      return next(new AppError(500, `文件保存失败: ${saveError.message}`));
    }

    try {
      // 使用pdf2md转换PDF为Markdown
      console.log('开始转换PDF文件:', tempFilePath);
      
      // 按照库的正确用法，先读取文件为Buffer
      const pdfBuffer = fs.readFileSync(tempFilePath);
      console.log('文件读取成功，Buffer长度:', pdfBuffer.length);
      
      // 定义回调函数
      const callbacks = {
        error: (err) => {
          console.error('转换过程中的错误:', err);
        },
        warn: (warning) => {
          console.warn('转换过程中的警告:', warning);
        },
        info: (info) => {
          console.log('转换过程信息:', info);
        }
      };
      
      // 使用正确的方式调用pdf2md
      const markdownContent = await pdf2md(pdfBuffer, callbacks);
      // console.log('转换后的Markdown内容:', markdownContent);
      console.log('PDF转换成功，生成Markdown内容长度:', markdownContent ? markdownContent.length : 0);
      
      // 删除临时文件
      fs.unlinkSync(tempFilePath);
      
      // 应用增强处理到Markdown内容
      const enhancedMarkdown = enhanceMarkdownContent(markdownContent);
      console.log('Markdown内容增强处理完成');
      
      // 返回转换后的增强Markdown内容
      res.status(200).json({
        status: 'success',
        message: 'PDF转换为Markdown成功',
        data: {
          markdownContent: enhancedMarkdown,
          originalFileName: Buffer.from(pdfFile.name, 'latin1').toString('utf8'),
          fileSize: pdfFile.size
        }
      });
    } catch (conversionError) {
      // 确保临时文件被删除
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      // 记录更详细的错误信息
      console.error('PDF转换失败:', conversionError.message);
      console.error('错误堆栈:', conversionError.stack);
      
      // 根据错误类型提供更具体的错误信息
      let errorMessage = 'PDF转换失败';
      if (conversionError.message && conversionError.message.includes('No such file')) {
        errorMessage = '临时文件不存在，转换失败';
      } else if (conversionError.message) {
        errorMessage = `PDF转换失败: ${conversionError.message}`;
      }
      
      return next(new AppError(500, errorMessage));
    }
  } catch (error) {
    console.error('处理PDF文件时出错:', error);
    return next(new AppError(500, '服务器内部错误，处理文件失败'));
  }
};

/**
 * 获取PDF文件的基本信息
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const getPdfInfo = async (req, res, next) => {
  try {
    console.log('开始获取PDF文件信息');
    
    // 检查是否有文件上传
    if (!req.files || !req.files.pdfFile) {
      console.error('未上传PDF文件');
      return next(new AppError(400, '请上传PDF文件'));
    }

    const pdfFile = req.files.pdfFile;
    const originalFileName = Buffer.from(pdfFile.name, 'latin1').toString('utf8');
    console.log('收到文件:', originalFileName);
    
    // 检查文件类型
    const fileExtension = path.extname(originalFileName).toLowerCase();
    console.log('文件扩展名:', fileExtension);
    
    if (fileExtension !== '.pdf') {
      console.error('文件类型不正确，期望.pdf，实际为', fileExtension);
      return next(new AppError(400, '请上传PDF格式的文件'));
    }

    // 返回PDF文件的基本信息
    const fileInfo = {
      fileName: Buffer.from(pdfFile.name, 'latin1').toString('utf8'),
      fileSize: pdfFile.size,
      mimeType: pdfFile.mimetype,
      encoding: pdfFile.encoding
    };
    
    console.log('PDF文件信息获取成功:', JSON.stringify(fileInfo));
    
    res.status(200).json({
      status: 'success',
      data: fileInfo
    });
  } catch (error) {
    console.error('获取PDF信息失败:', error.message);
    console.error('错误堆栈:', error.stack);
    return next(new AppError(500, `获取PDF信息失败: ${error.message}`));
  }
};

module.exports = {
  convertPdfToMarkdown,
  getPdfInfo
};