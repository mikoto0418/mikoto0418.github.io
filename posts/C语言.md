---
title: C语言
date: 2025-01-14 11:59:04
---

%d 十进制整数

scanf/scanf_s 读取键盘输入

double x 定义双精度变量x

`%.5f`表示输出一个双精度浮点数，保留 5 位小数
%lf 双精度浮点数
int（整型%d）、float（浮点型%f）、double（双浮点型%lf）、long（长整型%d）、char（字符型%c）


加减乘除+ - *  /
取余% 自增++ 自减—

自增自减优先级较低
=（赋值），优先级最低

```c
#define STR "Hello World!"#include <stdio.h>int main() {
    printf("%s\n", STR);
    printf("字符串的长度为：%zu\n", sizeof(STR) - 1);
    return 0;
}
```

`sizeof(MY_STRING)` 返回的是包括字符串末尾的空字符 `'\0'` 的整个字符数组的大小。所以需要减去 1 才是字符串的实际字符长度。 `%zu` 是用于输出 `size_t` 类型的格式说明符。



sprintf  是 C 语言标准库中的一个函数，用于将数据格式化并存储到指定的字符数组中。 其函数原型通常为： int sprintf(char *str, const char *format,...);  -  str  ：目标字符数组，用于存储格式化后的结果。-  format  ：格式化字符串，指定输出的格式。-  ...  ：可变参数列表，对应要格式化的具体数据。 例如， sprintf(numStr, "%d", num);  会将整数  num  以十进制整数的形式格式化并存储到  numStr  字符数组中。

![image](https://prod-files-secure.s3.us-west-2.amazonaws.com/ae2b6fd8-8637-423c-a6b9-74c87723e19b/62386d29-f990-4c2f-a904-6350c6ec076e/1000014995.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45FSPPWI6X%2F20250114%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250114T035855Z&X-Amz-Expires=3600&X-Amz-Signature=3e39afc434a350fb2431f8ac83701cddab5c1b8ba3ef9d5cfc7e83f2e90b92d4&X-Amz-SignedHeaders=host&x-id=GetObject)

![image](https://prod-files-secure.s3.us-west-2.amazonaws.com/ae2b6fd8-8637-423c-a6b9-74c87723e19b/bd550b3c-6d14-41f9-a44e-7e1d1fd48604/1000014019.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45FSPPWI6X%2F20250114%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250114T035855Z&X-Amz-Expires=3600&X-Amz-Signature=c48d4f6d27e7555bb80808cd9daf3911322d393b9ba178d554cd0fad4b8c3322&X-Amz-SignedHeaders=host&x-id=GetObject)

# **冒泡排序**

每一个字符与后一个字符比较，互换，交换数字为0时则所有数均有序，排序结束，交换次数为n-1

# **直接插入排序**

把每一次进行比较的数拿出来与前一个有序数字进行比较，出现小于则放到该数后一位（j+1）并跳出循环

排到最前面仍然没有出现比取出数小的数，此时直接跳出循环

即j>=0和temp<a[j],最后a[j+1]=temp temp为拿出来的数

### **特性**

### **1.时间复杂度**

最好情况就是全部有序，此时只需遍历一次，最好的时间复杂度为O ( n )

最坏情况全部反序，内层每次遍历已排序部分，最坏时间复杂度为O(n^2)

综上，因此[直接插入排序](https://so.csdn.net/so/search?q=%E7%9B%B4%E6%8E%A5%E6%8F%92%E5%85%A5%E6%8E%92%E5%BA%8F&spm=1001.2101.3001.7020)的平均时间复杂度为 O(n^2)

### **2.空间复杂度**

辅助空间是常量

平均的空间复杂度为：O ( 1 )

### **3.算法稳定性**

相同元素的前后顺序是否改变

![image](https://prod-files-secure.s3.us-west-2.amazonaws.com/ae2b6fd8-8637-423c-a6b9-74c87723e19b/e8bef321-442b-4e59-a30c-ddc6f4523a2f/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45FSPPWI6X%2F20250114%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250114T035900Z&X-Amz-Expires=3600&X-Amz-Signature=92ebef9b2bf98d66d3c49a96ac6b4b709e6afefc9138564aad5de687d4c12bdd&X-Amz-SignedHeaders=host&x-id=GetObject)

插入到比它大的数前面，所以直接插入排序是稳定的

比如说 原本在前面的1和原本在后面的1 排序后相对位置不变 即为算法的稳定性

1. 程序的结构有哪些？
顺序结构，分支结构，循环结构

1. 与或非？
&&（与），||（或），!（非）

1. 分支结构（判断语句，if和switch）
if(判断条件){

代码块（可以是if语句）

}

else if(判断条件){

代码块

}

else {

代码块

}

1. 编写一个程序，判断输入的数字是奇数还是偶数
课后作业：

1. 把4（编写一个程序，判断输入的数字是奇数还是偶数）做一遍
1. 
1. for循环
for (初始化;循环条件;一次循环结束后运行的语句)

{

循环代码块；

}

1. while循环
while(循环条件)

{

循环代码块；

}

课后作业：

洛谷B2081与7无关的数

（循环相关的题目都可以做做，至少做五个才能熟练）

1. 什么是数组 是一系列相同类型的变量
1. 如何定义数组
type arrayName[ arraySize ];

数据类型 数组名称 [数组大小];

//数组大小必须是一个明确知道其数值的数

1. 如何调用数组
for(int i=0;i<=2;i++){

scanf("%d", &arr[i]);

}

for(int i=0;i<=2;i++){

printf("%d\n",arr[i]);

}

1. 字符串
字符串就是，数据类型为char的变量的顺序集合

（char类型的数组）

课后作业：

1.数组求和

写一个程序，定义一个整型数组，输入5个整数，并计算这些整数的和。

2.数组反转

编写一个程序，输入一个包含10个整数的数组，然后反转这个数组并输出结果。

3.查找最大值

写一个程序，输入一个包含10个浮点数的数组，找出并输出数组中的最大值。

4.计算二维数组元素之和

描述：编写一个程序，计算一个3x3的整数二维数组所有元素的和，并输出结果。

1. 什么是函数
函数是一组一起执行一个任务的语句

1. 函数的定义
数据类型 函数名（参数）

{

函数体

}

**返回值的类型就是函数的数据类型，返回值本质上可以理解为，函数的值**

1. 函数的调用
函数名（实际参数）;

1. 递归
递归：在函数里调用自己

课后作业：

题目1：阶乘计算（递归）

描述：编写一个递归函数来计算一个非负整数的阶乘。

要求：

主函数中输入一个非负整数，调用递归函数计算并输出结果。

题目2：查找数组中的元素

描述：编写一个函数，用于在一个整数数组中查找特定元素，并返回其索引。如果未找到该元素，则返回 -1。

要求：

主函数中输入一个整数数组和要查找的元素，调用查找函数并输出结果。

[https://zhuanlan.zhihu.com/p/603216420](https://zhuanlan.zhihu.com/p/603216420)

[https://zhuanlan.zhihu.com/p/603216420](https://zhuanlan.zhihu.com/p/603216420)

