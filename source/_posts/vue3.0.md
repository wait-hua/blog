---
title: 译 - Vue3.0最新功能
date: 2018-12-02 14:00:00
tags: vue3.0
---

> 最近参加了 vueconf 会议，见到了尤大大关于 vue3.0 即将发布的最新功能，这里将会议视频内容整理成文章，待明年 vue3.0 发布时可对照源码学习下。

## Vue3.0主要会带来哪些功能

- 更快
- 更小
- 更易于维护
- 更好的多端渲染支持
- 新功能

### 更快
- vue3.0 将会对 virtual DOM 的实现进行完全重构，重构后的初始渲染、更新速度将会提升一倍。
- 更多编译时的优化以减少运行时的开销。如下几个编译时优化：
  - 在 vue2.0 中对 template 里的代码直接编译成字符串，对于组件也是用字符串表示，然后在运行的时候再去判断到底是原生的 DOM，还是我们写的组件。在 vue3.0 中，将会在编译阶段就直接判断，如果是组件，直接生成组件代码对应的原生 virtual DOM。如下所示：
    ```bash
        // Template
        <Comp></Comp>
        <div>
            <span></span>
        </div>
        // Compiler output
        render() {
            const Comp = resolveComponent('Comp', this)
            return createFragment([
                createComponentVNode(Comp, null, null, 0 /* no children */),
                createElementVNode('div', null, [
                    createElementVNode('span', null, null, 0 /* no children */)
                ], 2 /* single vnode child */)
            ], 8 /* multiple non-keyed children */)
        }
    ```
    并且在编译成 VNode 时，会记录一些信息跳过不需要的条件判断，如上面 div 下面只有一个子元素，在编译成 VNode 时，用2标记了只有一个子节点。并且在生成 virtual DOM 时函数调用尽可能的形状一致，如上面调用 createElementVNode 的时候函数参数个数是一样的，这样可以生成更易于被 JS 引擎优化的代码。
  - 优化 slots 生成。如下所示：
    ```bash
        // Template
        <Comp>
            <div>{{ hello }}</div>
        </Comp>
    ```
    在 vue2.0 中，hello 做为一个动态的 hello 传递到了子组件里，当我们要更新hello这个内容时，我们需要先更新父组件，父组件更新生成新的 slots 内容传递到子组件，然后子组件再更新。这样为了更新 hello 这个内容，同时触发了两个组件的更新。在 vue3.0 中把所有的 slot 统一成为一个函数传递到子组件中，由子组件自己来决定什么时候调用这函数，如下 vue3.0 中 slots 编译后的代码：
    ```bash
        // Compiler output
        render() {
            return h(Comp, null, {
                default: () => [h('div', this.hello)]
            }, 16 /* compiler generated slots */)
        }
    ```
    这样 hello 的更新只会触发子组件的更新，确保精确的组件级别依赖收集，避免不需要的父子关联更新。
  - 静态属性的提取。在 vue2.0 中做了静态内容的提取，对于完全静态的内容，直接提取出来，在之后可以直接复用这块 virtual DOM，并且比对过程中可以直接跳过整块这个内容。但是在 vue2.0 中，只要 html 中有一部分时动态的，那么它就不能被完全的静态化。如下 div 中包含一个动态的 text。 
    ```bash
        <div id="foo" class="bar">
        {{ text }}
        </div>
    ```
    在 vue3.0 中，如果这个元素本身的属性都是静态的，如上面 div 的 id、class，vue3.0 会将它的属性对象给提取出来，之后的比较中，这个元素本身就不需要比对了，只需要比对它的 children 即可。
  - 内联事件函数提取。如下所示：
    ```bash
        <Comp @event="count++"/>
    ```
    其中的 count++ 其实会生成一个内联函数，每次渲染的时候都会生成一个新的内联函数，这个函数跟之前的函数是不一样的两个函数，虽然两个函数做的事情都是一样的，但是为了安全起见，每次都会重新渲染这个子组件每次都重新渲染。在 vue3.0 中，在这个函数生成一遍之后，就将它 cache 起来，之后的每次都用这同一个函数，避免子组件的再次重新更新，如下编译后的代码所示：
    ```bash
        import { getBoundMethod } from 'vue'
        function __fn1 () {
            this.count++
        }
        render() {
            return h(Comp, {
                onEvent: getBoundMethod(__fn1, this)
            })
        }
    ```
- 基于 Proxy 的新数据监听系统，全语言特性支持 + 更好的性能。vue3.0 中将放弃 Object.defineProperty，使用 [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) 的全新数据监听，我们知道 Object.defineProperty 对于对象属性的添加，数组的 push 等操作都是监听不到的，Proxy可以监听到对象属性增添/删除，数组 index/length 更改等。利用 Proxy 可以减少组件实例初始化开销。但是 Proxy 仅支持 IE Edge。

    通过上面这些优化，vue3.0 组件实例初始化可加快达一倍，并且占用内存减半。

### 更小

在 vue2.0 中，所有的代码都在一个 vue 全局对象上，那些你代码中没有用到东西也没有办法扔掉。在 vue3.0 做了按需引入，只有你代码用到了哪些功能，才会去 import 相关的代码，再结合 Tree shaking 将那些没有用到的代码扔掉。这样 vue3.0 中最小核心运行时的代码大约只需要10kb gzipped。
### 更易于维护

vue3.0 将使用 typescript 重写，并且使用了 monorepo 进行内部模块解耦。
### 更好的多端渲染支持

   vue3.0 中提取出了一个核心的 @vue/runtime-core 包，可以使用这个核心包进行开发可运行在小程序中等其他环境中。以往 vue2.0 中如果要开发一个可运行在小程序其他端中的化，可能需要 fork 一份 vue 源码然后进行改写，这样的话后续 vue 的升级可能需要解决冲突，或者看 vue 的更新源码，这样就非常的不方便。
### 新功能
- 响应式数据监听 API。vue3.0 中开放出了一个 observable API，可实现一些响应式数据监听。如下所示：
```bash
    import { observable, effect } from 'vue'
    
    const state = observable({
        count: 0
    })

    effect(() => {
        console.log(`count is: ${state.count}`)
    }) // count is: 0

    state.count++ // count is: 1
```
- 轻松排查组件更新的触发原因。vue3.0 中提供了一个钩子函数，renderTriggered 在这个钩子函数中可以看到具体是什么触发了组件的更新。
```bash
    const Comp = {
        render(props) {
            return h('div', props.count)
        },
        renderTriggered(event) {
            debugger
        }
    }
}
```
- 更好的 TypeScript 支持，包括原生的 Class API 和 TSX。
```bash
    interface HelloProps {
        text: string
    }
    class Hello extends Component<HelloProps> {
        count = 0
        render() {
            return <div>
            {this.count}
            {this.$props.text}
            </div>
        } 
    }
```
- 更好的警告信息。
    - 组件堆栈包含函数式组件
    - 可以直接在警告信息中查看组件的 props
    - 在更多的警告中提供组件堆栈信息
- Hooks API。

    即 React Hooks 的提出，vue3.0 中也将提供 Hooks API 作为一种逻辑复用机制，大概率取代 mixins。
- Time Slicing Support。

    React17 中也提出 time slicing: [https://blog.pusher.com/time-slice-suspense-api-react-17/](https://blog.pusher.com/time-slice-suspense-api-react-17/)，让框架在进行大量 JS 计算的时候，把 JS 计算切成一帧一帧的计算，不要让大量的 js 计算 block 了浏览器的主线程，浏览器在 block 时会处于一个完全没有响应的状态，用户的输入点击等都是无法被响应的，如果用户的输入导致了大量的 JS 计算，同时用户继续输入的话，会明显的一个输入卡顿性能下降的情况。要改进这个问题，可以通过每 16ms 处理完之后交还给浏览器，让用户的事件重新进来，触发更新，中间可能还可以因用户的输入导致新的更新，之前不必要的处理就不需要执行了，这样就不会造成一个卡顿的现象。

### 关于IE。

前面提到了使用新的proxy数据监听是不支持IE11及以下的，那么在 IE11 中自动降级为旧的 getter/setter 机制，并对 IE 中不支持的用法给出警告，并且 IE11 中享受不了部分新的功能了。看来是时候放弃兼容 IE 了，感觉很好，回想兼容 IE8 是的可怕时光。。。

> 我不是知识的创造者，我只是知识的搬运工。