---
title: 黑马VUE
date: 2025-01-14 12:00:49
---

VUE是用于构建用户页面的渐进式框架

用this代替当前const变量名 指向当前实例

参数位置补形参

v-for=”(item,index) in list”

list=[’1’,’2’,’3’] 循环item的话会出来123 index会出来下标（012)

不写index可以省略 可以item in list

发送初始化渲染请求：创建阶段

操作DOM：挂载阶段

生命周期钩子

操作dom在mounted阶段后 

watch(newValue,oldValue){

}

↑保留两位小数

scoped 全局改局部组件

父传子

子改父

删除：filter自己id 保留其他的id 先监听得到id 子传父上传id filter过滤id

本地持久化：watch深度监听 名称.setItem(key,value)把value值存入key JSON.stringify()转化为JSON字符串

在需要显示的（列表）位置用getItem拿出来 用JSON.parse()重转换为原始格式

e 事件默认参数

v-model仅在父组件中使用 子组件不能用

v-model  ⇒ :value+@input

value接收value绑定父组件vmodel 必须触发input(this.$emit(’input’,xxxx)

:visible.sync ⇒  :visible+@update:visible

子组件this.$emit(’update:visible’,false)父组件:visible.sync=”isShow”把false通过sync传给父isshow

值确实不是value了（不是表单了）可以用,sync平常可以直接v-model

**ref和$refs

第一步：给目标标签加上ref <div ref=”xxx”

第二步 恰当时机（渲染完毕 mounted（）{ this.$refs.xxx获取目标标签

！！父组件可以通过此方法直接使用子组件的方法

VUE异步更新：$nextTick this.$nextTick(函数体）等dom更新之后才会触发执行此方法里的函数体

插槽 需要定制的位置<slot></slot>占位

然后在使用组件时在组件标签里面填内容

也可以写div等标签 不是只能文本

当在slot之间写的文本则被作为没有传入的默认内容

多个插槽用name区分 slot name=” “ 然后原来的组件里面直接写内容改成<template #name>来分发对应标签

删除或查看都需要用到当前项目的id

npm install vue-router@3.6.5

