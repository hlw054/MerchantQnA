# 商家知识管理系统 - 代码规范

## 界面组件组织规范

### 1. 文件夹结构
对于每一个界面，应创建对应的文件夹，文件夹内包括：
- `index.tsx`: 主页面文件
- `styles.css`: 页面样式文件

**说明**：对于简单页面（如Login、Register、ForgotPassword等），不需要components文件夹，所有逻辑直接在index.tsx中实现即可。

### 2. 目录结构示例
```
src/
├── pages/
│   ├── Login/
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── Register/
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── ForgotPassword/
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── Dashboard/  # 复杂页面可以有components
│   │   ├── index.tsx
│   │   ├── components/
│   │   └── styles.css
│   └── ...
└── ...
```

### 3. 组件命名规范
- 页面组件：使用大驼峰命名法，如 `LoginPage`
- 子组件：使用大驼峰命名法，如 `LoginForm`
- CSS文件：使用小写字母加连字符，如 `styles.css`

### 4. 样式管理
- 每个页面应有独立的CSS文件
- 共享组件样式可放在公共样式文件夹中
- 优先使用CSS类选择器，避免使用ID选择器

### 5. TypeScript类型规范
- 使用类型导入：`import type { ReactNode } from 'react';`
- 为所有组件和函数添加类型注解
- 避免使用 `any` 类型

### 6. 图标使用规范
- 统一使用组件库提供的图标
- 图标导入方式：`import { IconName } from '@arco-design/icons-react';`

### 7. 错误处理
- 使用 `Message` 组件显示错误信息，格式为 `Message.error('错误信息')`
- 表单验证应在提交前完成

### 8. 代码格式化
- 使用ESLint和Prettier保持代码风格一致
- 遵循2空格缩进
- 语句结尾使用分号