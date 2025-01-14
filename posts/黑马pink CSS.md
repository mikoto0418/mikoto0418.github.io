---
title: 黑马pink CSS
date: 2025-01-14 12:00:55
---

CSS选择器

1.元素选择器（标签选择器）

* 只能选择全部标签
* 写在body之前（<head></head>之间）写在<style>之间
p {

	color: red;

}

<p>111111</p>

效果就是111111变红

选择了所有名为p的标签

2.类选择器（class）

.red {

	color: red;

}

<p class=”red”>1111</p>

<p>2222</p>

效果只有1111变红 2222不变

* 开头用.后面名字自定义 调用用class
1. id选择器 
* 只能使用一次 一般配合JS
* 无需调用 一般用于唯一性元素
* 以＃定义
#red {

color: red;

}

<div id=”red”>1</div>

4.通配符选择器

“选择所有标签”

*{

      color: red;

}

font-family 字体 英文中文都可以

font-size 单位px 

font-weight 字体粗细

* bold加粗
建议直接用数字 font-weight 700;这种格式

font-style 字体风格 normal正常 italic斜体

color 可以用单词 可以用rgb 可以用十六进制 ＃91bef0

text-align left左 right右 center居中

* 给a href加none可以去掉链接的下划线

text-indent 首行缩进：只需要选择段落然后text-indent 2em 相对缩进两个文字 也可以用px

line-height 行间距 包含上下间距加起来 可以用测量工具测px（上一行最下沿量到下一行最下沿）

<style>理论上可以写在任何位置 但是一般写在head里面 称为嵌入式

行内表则是

写在单行里

# 外部样式表

建立.css文件 

<link rel=”stylesheet” href=”css文件路径”>放到html里面

以建立css和html的链接

## Emmet语法

写css只需写每个单词首字母＋内容

w100→width: 100;

tdnone→text－decoration: none;

后代选择器 即

元素父 元素子 ｛样式声明｝

元素也可以用类选择器 且可以选择无数代

* 与子选择器区分
* 子选择器 .nav > li 只会选择最近一代
并集选择器

div,p{

} 标签之间英文逗号分隔开、

链接文字#333黑

**块元素**

* 块元素独占一行
* 高度宽度外边距内边距可控
* 宽度默认是父级宽度
* 是一个容器，盒子，里面可以放行内和块元素
**行内元素（内联元素）**

* 相邻行内元素在一行上 一行可以显示多个
* 高度宽度直接设置是无效的
* 默认宽度是本身内容的宽度
* 行内元素只能容纳文本/其他行内元素
行内块元素<img /><input /><td>

