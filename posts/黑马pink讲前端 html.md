---
title: 黑马pink讲前端 html
date: 2025-01-14 12:00:58
---

标题<h1> </h1>

h1到h6 字号加大字体加粗 重要程度1到6递减 标题独占一行

<p></p>段落

<br />强制换行 否则会按照浏览器大小换行

div一行一个 span一行可以多个

* src是必要的 其他属性是选择性的
* 格式key＝”value”
空链接用#即未定义

下载链接: 如果 href 里面地址是一个文件或者压缩包，会下载这个文件

### 锚点链接

**重点记 空格&nbsp; 小于号&lt; 大于号&gt;

表格

<table>写到table标签里面的如图

<th>姓名</th> <th>性别</th> 表头 加粗

<tr><td>一格</td><td>里面的内容</td><td>放td里面</td></tr>

tr是一行 td是一格

<thead>表头<tbody>表内

列表

1.无序标签<ul>

<li>内容</li>li里面可以包含任何元素

但是不能直接放到ul里面 </ul>

2.有序标签 自动排序<ol>

同样只能用<li>有顺序并且使用较少

3.自定义列表

<dl>内部包含<dt>和<dd>

dt是大的 dd是下方的解释

<dt>帮助中心</dt>

<dd>账户管理</dd>

表单

<form>表单域定义

<form action=”url” method=”提交方式(get/post)” name=”表单域的名称”>

</form>

*<input>输入 通过改变type改变对应属性

<input type=”属性” />是单标签

提示文字写在外面

<body>

	<form>

		密码：<input type=”password”> <br>

	</form>

</body>

********

所有相关的单选or复选项必须有相同的名字

即name标签相同以实现多选一

value 默认输入的值

checked=”checked”即为默认勾选

maxlength不常用

数据标注标签

<label for=”sex”>男</label><input type=”radio” name=”sex” id=”sex” />

作用是让点击男这个字的时候就能点到单选框

下拉菜单<select>

<select>

	<option>选项1</option>

	<option>选项2</option>

	…

</select>

默认选中

<option selected=”selected”>火星</option>

页面加载的时候默认停留在  火星

**select至少包含一对option

文本域textarea

<textarea rows=”3” cols=”20”>框内预先出现的内容直接写在中间</textarea>

cols=每行中的字符数 rows＝显示的行数

但实际开发中使用CSS而不使用这种方式

