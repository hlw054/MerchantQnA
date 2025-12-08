import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, Typography, Button } from '@arco-design/web-react';
import { IconMessage, IconBook, IconArrowUp } from '@arco-design/web-react/icon';
import styles from './styles.module.css';

const Home: React.FC = () => {
  const [animatedSections, setAnimatedSections] = useState<{[key: string]: boolean}>({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRefs = useRef<{[key: string]: HTMLElement | null}>({});

  // 监听滚动，添加滚动动画效果和滚动到顶部按钮
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          setAnimatedSections(prev => ({ ...prev, [id]: true }));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // 观察所有主要区域
    const sections = ['heroSection', 'featuresSection', 'advantagesSection'];
    sections.forEach(section => {
      if (sectionRefs.current[section]) {
        observer.observe(sectionRefs.current[section]!);
      }
    });

    // 监听滚动位置，控制回到顶部按钮显示
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      sections.forEach(section => {
        if (sectionRefs.current[section]) {
          observer.unobserve(sectionRefs.current[section]!);
        }
      });
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 滚动到顶部功能
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 核心功能
  const features = [
    {
      title: '商家知识平台',
      description: '集中管理和分享商家运营、营销、客服等方面的专业知识，帮助商家快速获取所需信息。',
      icon: <IconBook />,
      link: '/rules',
      bgColor: 'rgba(24, 144, 255, 0.1)',
      iconColor: '#1890ff',
    },
    {
      title: '智能问答机器人',
      description: '基于AI技术的智能机器人，24小时为商家解答各类问题，提供高效便捷的服务。',
      icon: <IconMessage />,
      link: '/qa',
      bgColor: 'rgba(82, 196, 26, 0.1)',
      iconColor: '#52c41a',
    },
  ];

  return (
      <div className={styles.homeContainer}>
        {/* 滚动到顶部按钮 */}
        <button 
          className={`${styles.scrollToTop} ${showScrollTop ? styles.visible : ''}`}
          onClick={scrollToTop}
          aria-label="回到顶部"
        >
          <IconArrowUp />
        </button>
      {/* 英雄区域 - 确保宽度与Header一致 */}
      <div 
        id="heroSection"
        ref={el => { sectionRefs.current['heroSection'] = el; }}
        className={`${styles.heroSection} ${animatedSections['heroSection'] ? styles.animateIn : ''}`}
      >
        <div className={styles.heroContent}>
          <Typography.Title className={styles.heroTitle}>
            商家知识智能服务平台
          </Typography.Title>
          <Typography.Text className={styles.heroSubtitle}>
            一站式解决方案，助力商家高效运营、智能问答
          </Typography.Text>
          <div className={styles.heroActions}>
            <Link to="/qa">
              <Button type="primary" size="large" className={styles.actionButton}>
                立即提问
              </Button>
            </Link>
            <Link to="/rules">
              <Button size="large" className={styles.actionButton}>
                浏览知识
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 核心功能区域 - 确保宽度与Header一致 */}
      <div 
        id="featuresSection"
        ref={el => { sectionRefs.current['featuresSection'] = el; }}
        className={`${styles.featuresSection} ${animatedSections['featuresSection'] ? styles.animateIn : ''}`}
      >
        <Typography.Title className={styles.sectionTitle}>
          核心功能
        </Typography.Title>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureItem}>
              <Card className={styles.featureCard} hoverable>
                <div className={styles.featureContent}>
                  <div 
                    className={styles.featureIcon}
                    style={{ backgroundColor: feature.bgColor }}
                  >
                    <div style={{ color: feature.iconColor }}>
                      {feature.icon}
                    </div>
                  </div>
                  <div className={styles.featureDetails}>
                    <Typography.Title className={styles.featureTitle}>
                      {feature.title}
                    </Typography.Title>
                    <Typography.Paragraph className={styles.featureDescription}>
                      {feature.description}
                    </Typography.Paragraph>
                    <Link to={feature.link}>
                      <Button type="text" className={styles.featureLink}>
                        了解更多 →
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* 平台优势区域 - 确保宽度与Header一致 */}
      <div 
        id="advantagesSection"
        ref={el => { sectionRefs.current['advantagesSection'] = el; }}
        className={`${styles.advantagesSection} ${animatedSections['advantagesSection'] ? styles.animateIn : ''}`}
      >
        <Typography.Title className={styles.sectionTitle}>
          平台优势
        </Typography.Title>
        <div className={styles.advantagesGrid}>
          <div className={styles.advantageItem}>
            <div className={styles.advantageIcon}>
              <IconBook style={{ color: '#1890ff' }} />
            </div>
            <Typography.Title className={styles.advantageTitle}>
              丰富的知识库
            </Typography.Title>
            <Typography.Paragraph className={styles.advantageDescription}>
              涵盖电商运营、营销推广、客户服务等多个领域的专业知识
            </Typography.Paragraph>
          </div>
          <div className={styles.advantageItem}>
            <div className={styles.advantageIcon}>
              <IconMessage style={{ color: '#52c41a' }} />
            </div>
            <Typography.Title className={styles.advantageTitle}>
              智能问答服务
            </Typography.Title>
            <Typography.Paragraph className={styles.advantageDescription}>
              AI驱动的智能机器人，快速准确地解答商家各类问题
            </Typography.Paragraph>
          </div>
          <div className={styles.advantageItem}>
            <div className={styles.advantageIcon}>
              <IconBook style={{ color: '#faad14' }} />
            </div>
            <Typography.Title className={styles.advantageTitle}>
              提升运营效率
            </Typography.Title>
            <Typography.Paragraph className={styles.advantageDescription}>
              一站式解决方案，帮助商家节省时间，提高运营效率
            </Typography.Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;