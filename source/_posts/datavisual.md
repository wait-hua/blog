---
title: 常用的数据可视化框架
date: 2018-12-27 16:02:53
tags: 数据可视化
---

最近负责的业务涉及一些数据可视化展示，面对可视化的数据展示方面，往往会选择一款第三方的可视化工具，本文主要收集了一些主流开源的数据可视化框架，并附上部分小demo供参考。

## d3 Data-Driven Documents
  - 官网: [https://d3js.org/](https://d3js.org/)
  - API文档：[https://github.com/d3/d3/blob/master/API.md](https://github.com/d3/d3/blob/master/API.md)

    提到数据可视化，就不得不提大名鼎鼎的 D3。2011年，Mike Bostock、Vadim Ogievetsky 和 Jeff Heer 发布了 D3，目前 github 上 star 数已达到8万 + 。用其官网介绍，D3 是一个基于数据操作文档的库，D3 帮助你给数据带来活力通过使用 HTML、SVG 和 CSS，结合强大的可视化组件和数据驱动方式操作 Dom。使用 D3 可以实现很多自定义的动态数据交互，它的很大优点是：
    1. 灵活度高，可以使用它的基础 API 实现各种复杂的数据展示及结合自定义的交互操作。
    2. 数据绑定到 DOM，能直接操作 DOM。
    3. 自 D3 v4 开始即可基于 SVG，也可基于 Canvas 实现可视化，在数据量很大并且有交互更新视图的情况下，可使用基于 Canvas，如果数据量不是特别大的情况下，使用 SVG 非常方便。
    4. 社区活跃 demo 众多。
  
    缺点是有一定的学习门槛，它并没有像 Echarts 样提供高度封装好的 API。  

    用 D3 实现一个简单的树形图展示：
  ```bash
    import * as d3 from 'd3';
    import './d3.scss';

    const data = {
        name: '0',
        children: [
            {
                name: '0-0',
                children: [
                    {
                        name: '0-0-0'
                    },
                    {
                        name: '0-0-1'
                    },
                    {
                        name: '0-0-2'
                    }
                ]
            },
            {
                name: '0-1',
                children: [
                    {
                        name: '0-1-0'
                    },
                    {
                        name: '0-1-1'
                    },
                    {
                        name: '0-1-2'
                    }
                ]
            },
            {
                name: '0-2',
            },
            {
                name: '0-3'
            }
        ]
    };

    const width = 700,
        height = 700;

    const tree = d3.tree()
        .size([width, height]);

    const diagonal = d3.linkHorizontal()
        .x(function (d) { return d.y; })
        .y(function (d) { return d.x; });

    const svg = d3.select("#root").append("svg")
        .attr("width", width + 800)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(40,0)");

    const nodes = d3.hierarchy(data, d => d.children);

    const treeNodes = tree(nodes);

    // 创建线条
    svg.selectAll(".link")
        .data(treeNodes.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", diagonal);

    // 创建节点
    const node = svg.selectAll(".node")
        .data(treeNodes.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });

    // 节点添加圆圈
    node.append("circle")
        .attr("r", 4.5);

    // 节点添加文本描述
    node.append("text")
        .attr("dx", 0)
        .attr("dy", -8)
        .style("text-anchor", 'middle')
        .text(function (d) { return d.data.name; });
  ```
  上面的代码是不是有种是曾相识的感觉，对，很像用 jquery 时操作 DOM 的用法。

## 百度的echarts
  - 官网：[http://echarts.baidu.com](http://echarts.baidu.com)

    相比 D3, echarts 的使用就可以说相对易用很多了。echarts 提供了大量的可视化类型，折线图、饼状图、地理图、热力图等等，并有大量的 demo, 社区也很活跃，文档也很全面。如果你的可视化展示需求比较简单，并且自定义交互并不复杂，那么 echarts 完全满足你的需求，并且使用起来也简单易用。缺点是扩展性并不是那么友好。
  
    用 echarts 实现一个多折线图表：
  ```bash
    import Echarts from 'echarts';

    const echart = Echarts.init(document.getElementById('root'));
    echart.setOption({
        title: {
            text: '折线图'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data:['邮件营销','联盟广告']
        },
        toolbox: {
            feature: {
                saveAsImage: {}
            }
        },
        xAxis: {
            type: 'value',
            name: '区间',
            nameLocation: 'middle',
            nameTextStyle: {
                fontWeight: 'bold',
                fontSize: 16
            },
            nameGap: 25
        },
        yAxis: {
            type: 'value',
            name: '数量',
            nameLocation: 'middle',
            nameTextStyle: {
                fontWeight: 'bold',
                fontSize: 16
            },
            nameGap: 55

        },
        series: [
            {
                name:'邮件营销',
                type:'line',
                data:[[20, 40], [40, 90], [70, 100], [90, 200]]
            },
            {
                name:'联盟广告',
                type:'line',
                data:[[0, 40], [50, 70], [80, 100], [110, 300]]
            }
        ]
    })
  ```

## 阿里的G2
  - 官网：[https://antv.alipay.com/zh-cn/g2/3.x/demo/index.html](https://antv.alipay.com/zh-cn/g2/3.x/demo/index.html)

    G2 是阿里在2016开源的一套图表库，图表资源丰富。G2 背后的理论基础，也就是图形语法是基于 Leland Wilkinson 写的 The Grammar of Graphics，有兴趣的同学可以看看。G2 的优点简单易用，用户一条语句即可构建出各种各样的可交互的统计图表，相比于 echarts G2 更易于用来扩展自定义的图表，且风格较 echarts 更美观些。G2 3.2.7以前是基于 Canvas 的，3.2.7之后也同时支持 SVG了，关于如何选择基于 Canvas 或者 SVG，可以查看 G2 关于这部分的介绍：[选择 Canvas 还是 SVG](https://www.yuque.com/antv/g2-docs/tutorial-renderers)。

    G2 主要是一些统计图表，柱状图、饼图、地图、雷达图等，对于树形图，需要使用 G6，G6 底层依赖了 D3。

    用 G2 使用实现一个多折线图表：
    ```bash
        import G2 from '@antv/g2';
        import DataSet from '@antv/data-set';

        const data = [{
            month: 'Jan',
            Tokyo: 7.0,
            London: 3.9
        }, {
            month: 'Feb',
            Tokyo: 6.9,
            London: 4.2
        }, {
            month: 'Mar',
            Tokyo: 9.5,
            London: 5.7
        }, {
            month: 'Apr',
            Tokyo: 14.5,
            London: 8.5
        }, {
            month: 'May',
            Tokyo: 18.4,
            London: 11.9
        }, {
            month: 'Jun',
            Tokyo: 21.5,
            London: 15.2
        }, {
            month: 'Jul',
            Tokyo: 25.2,
            London: 17.0
        }, {
            month: 'Aug',
            Tokyo: 26.5,
            London: 16.6
        }, {
            month: 'Sep',
            Tokyo: 23.3,
            London: 14.2
        }, {
            month: 'Oct',
            Tokyo: 18.3,
            London: 10.3
        }, {
            month: 'Nov',
            Tokyo: 13.9,
            London: 6.6
        }, {
            month: 'Dec',
            Tokyo: 9.6,
            London: 4.8
        }];

        const ds = new DataSet();
        const dv = ds.createView().source(data);
        // fold 方式完成了行列转换，如果不想使用 DataSet 直接手工转换数据即可
        // 转化成 {month: 'Jan', city: 'Tokyo', temperature: 3.9}
        dv.transform({
            type: 'fold',
            fields: ['Tokyo', 'London'], // 展开字段集
            key: 'city', // key字段
            value: 'temperature' // value字段
        });

        const chart = new G2.Chart({
            container: 'root',
            width: 800,
            height: 500,
        });

        chart.source(dv, {
            month: {
                range: [0, 1]
            }
        });

        chart.tooltip({
            crosshairs: {
                type: 'line'
            }
        });

        chart.axis('temperature', {
            label: {
                formatter: function formatter(val) {
                    return val + '°C';
                }
            }
        });

        chart.line().position('month*temperature').color('city').shape('smooth');
        chart.point().position('month*temperature').color('city').size(4).shape('circle').style({
            stroke: '#fff',
            lineWidth: 1
        });

        chart.render();
    ```

## 阿里的F2: 针对移动端的数据可视化库
  - 官网：[https://antv.alipay.com/zh-cn/f2/3.x/demo/index.html](https://antv.alipay.com/zh-cn/f2/3.x/demo/index.html)

    和 G2 类似，F2 也是基于图形语法实现的一套图表库，不同的是，F2 专注于移动端，完美支持 H5 环境同时兼容多种环境（Node, 小程序，Weex），专业的移动端交互设计。使用上和 G2 差不多。

## hightcharts
  - 官网：[https://www.highcharts.com/](https://www.highcharts.com/)

    hightcharts 和 echarts 类型，不过 echarts 是完全免费的，hightcharts 基于商业用途是需要授权。官网的 demo 也是非常的丰富。highcharts 由四部分组成：HighCharts、Highstock、Highmaps 和 gantt。HighCharts 支持的图表类型有曲线图、区域图、柱状图、饼状图、散点图和一些综合图表。 HighStock 可以为用户方便地建立股票或一般的时间轴图表，它提供先进的导航选项，预设的日期范围，日期选择器，滚动和平移等。Highmaps 提供一些地图类图表。gantt 提供甘特图类图表。

    用 highcharts 实现一个多折线图表：
    ```bash
        import Highcharts from 'highcharts';
        import Exporting from 'highcharts/modules/exporting';

        Exporting(Highcharts);

        Highcharts.chart('root', {
            chart: {
                type: 'line'
            },
            title: {
                text: 'Monthly Average Temperature'
            },
            subtitle: {
                text: 'Source: WorldClimate.com'
            },
            xAxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            },
            yAxis: {
                title: {
                    text: 'Temperature (°C)'
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: false
                }
            },
            series: [{
                name: 'Tokyo',
                data: [7.0, 6.9, 9.5, 14.5, 18.4, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
            }, {
                name: 'London',
                data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
            }]
        });
    ```
## charts.js
  - 官网：[https://www.chartjs.org/](https://www.chartjs.org/)
    
    非常轻量级，动画美观，且支持模块化，即开发者可以拆分 Chart.js 仅引入自己需要的部分进入工程。缺点是仅仅只有几种基础的图表类：折线图、柱状图、散点图、区域图。

## 阿里的L7:地理空间数据可视化
  - 官网：[https://antv.alipay.com/zh-cn/l7/1.x/demo/index.html](https://antv.alipay.com/zh-cn/l7/1.x/demo/index.html)

    L7 是基于地理空间的数据可视化，易用易扩展，支持海量数据的高性能和 3D 高质量渲染。

## Leaflet
  - 官网：[http://leafletjs.com/](http://leafletjs.com/)

    本身的内核库很小，丰富的插件可以大幅拓展其功能，主要用于需要展示地理位置的项目。可同时运行桌面端和移动端。

## Recharts
 - 官网：[http://recharts.org/zh-CN/](http://recharts.org/zh-CN/)

    Recharts 是 React 结合 D3 的一个图表库，依赖于轻量级的 D3 子模块构建 SVG 元素。可以调整组件的属性与传递组件自定义你的图表。官网上提供了9中图表类型，也有响应的示例，对于习惯用 react 组件，这个图表库的用法和 react 组件用户基本一样。

    用 recharts 实现的折线图表：
   ```bash
        import React, { PureComponent } from 'react';
        import ReactDOM from 'react-dom';
        import {
            LineChart,
            Line,
            XAxis,
            YAxis,
            CartesianGrid,
            Tooltip,
            Legend
        } from 'recharts';

        const data = [
            { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
            { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
            { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
            { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
            { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
            { name: 'Page F', uv: 2390, pv: 3800, amt: 2500 },
            { name: 'Page G', uv: 3490, pv: 4300, amt: 2100 },
        ];

        class SimpleLineChart extends PureComponent {
            render() {
                return (
                    <LineChart width={600} height={300} data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
                    </LineChart>
                );
            }
        };

        ReactDOM.render(
            <SimpleLineChart />,
            document.getElementById('root')
        );
   ```
## React-vis 
  - 官网：[https://uber.github.io/react-vis/](https://uber.github.io/react-vis/)

    React-vis 是 Uber 开源的一款图表库，包括线、面、柱状图、热图、散热图、等高线图、六角热图等等。使用上对 React 开发者非常友好，和 React 组件差不多。使用该库不需要事先掌握 D3 或任何其他 data-vis 库的知识，并提供了低级模块化的构建块组件，如 x/y 轴。官方 demo 也挺丰富的。



> 文中 demo 主要从代码层面展示各个框架的用法，具体代码及效果图可参考：[https://github.com/wait-hua/datavisual](https://github.com/wait-hua/datavisual) 

> 这里介绍的都是文档和demo都比较丰富的数据可视化框架，欢迎推荐其他好用的数据可视化框架。

References:
- https://github.com/xswei/d3js_doc
- https://blockbuilder.org/63anp3ca/e73145f5f74a3ef86e4ba76371a9d907
- http://efe.baidu.com/blog/14-popular-data-visualization-tools/
- http://www.10tiao.com/html/788/201809/2247489515/1.html

