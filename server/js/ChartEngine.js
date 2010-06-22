/*
 * Copyright 2009 VoidSearch.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

var ChartEngine = Class.create({
    initialize: function (options) {
        //get options
        this.options = options;

        // DEFAULTS
        //this.options.numResults   = this.options.chartData.length;
        this.chartPadding = 10;
        this.leftPadding = 26.5;
        this.rightPadding = 50.5;
        this.bottomPadding = 30.5;
        this.topPadding = 26;
        this.axisColor = '#cacaca';
        this.axisOpacity = 1;
        this.paddingFactor = 0.00;
        this.drawMinMaxLines = false;
        this.forceScope = false;
        this.forceMaxValue = 0;
        this.forceMinValue = 0;
        this.scatterChunkSize = 1000;
        this.updated = false;
        this.firstPass = false;
        this.prevElement = false;
        this.drawScatterGrid = false;
        this.hashGridSize = 8;
        this.hashGrid = {};
        this.dotMaxRadius = 25;
        this.dotMinRadius = 3;
        this.dotRadius = 4;
        // init canvas
        this.canvas = new Visuals(options.canvasID);
        this.canvasWidth = this.canvas.containerWidth;
        this.canvasHeight = this.canvas.containerHeight;


        //reset drawing surface
        this.canvas.reset();

        //prepare graph, and if ok draw data
        if (this.prepareGraph()) {

        }
    },


    redrawHistogram:function(event) {
        var self = this;

        var offset = this.canvas.canvasElement.cumulativeOffset();
        var y = event.pointerY() - offset.top;
        var x = event.pointerX() - offset.left;

        var timeoutFunc = function () {
            self._redrawHistogram(x, y);
        };
        if (!this.timer) {
            this.timer = setTimeout(timeoutFunc, 10);
        } else {
            return false;
        }
    },

    _redrawHistogram:function(x, y) {

        this.clearDrawingArea();
        //this.resetAndRedraw();
        this.drawComplexHistogram(x, y);
        clearTimeout(this.timer);
        this.timer = false;
    },

    clearDrawingArea:function() {
        this.canvas.clear(this.clearX, 0, this.clearW, this.clearH);
    },

    resetGraph:function() {
        this.canvas.reload();
        this.canvasWidth = this.canvas.canvasElement.getWidth();
        this.canvasHeight = this.canvas.canvasElement.getHeight();
        this.xAxis = new xAxis(this);
        this.yAxis = new yAxis(this);

        this.drawAxes();
    },

    resetAndRedraw:function() {
        this.canvas.reset();
        this.resetGraph();
        this.drawChart();
    },

    getPadding: function () {
        return[this.topPadding, this.rightPadding, this.bottomPadding, this.leftPadding];
    },

    getCanvas: function () {
        return this.canvas;
    },

    printError: function (text) {
        this.canvas.reset();
        this.chart.canvas.text(text.toString(), 10, 10, 10, '#414141', 0.9);

    },

    prepareGraph: function () {
        var chartOk = false;
        if (typeof(this.options.type) != 'undefined') {
            this.xAxis = new xAxis(this);
            this.yAxis = new yAxis(this);
            this.drawAxes();
            chartOk = true;
        } else {
            this.printError('invalid data returned!');
            chartOk = false;
        }
        return chartOk;
    },

    drawChart: function () {
        var self = this;
        switch (this.options.type) {
            case 'bars':
                this.drawGenericGraph();
                break;
            case 'complexHistogram':

                var data = this.options.chartDataRaw;
                this.options.chartData = [];
                this.options.chartXLabels = [];
                $H(data.entries).each(function(element) {
                    self.options.chartData.push(element[1]);
                    self.options.chartXLabels.push(element[0]);
                });

                this.drawGenericGraph();
                break;

            case 'api-scatter':
                this.drawAPIScatterGraph();
                break;

            case 'scatter':
                this.drawScatterGraph();
                break;

            case 'line':
                this.drawGenericGraph();
                break;

            case 'multiple-lines':
                this.drawGenericMultiple();
                break;
        }
    },

    drawAxes: function () {
        this.xAxis.draw();
        this.yAxis.draw();
    },

    drawAPIScatterGraph: function () {
        var self = this;

        this.options.apiXMax = parseFloat(this.options.apiXMax);
        this.options.apiXMin = parseFloat(this.options.apiXMin);
        this.options.apiYMax = parseFloat(this.options.apiYMax);
        this.options.apiYMin = parseFloat(this.options.apiYMin);

        this.xMax = Math.ceil(this.options.apiXMax + ((this.options.apiXMax - this.options.apiXMin) * 0.05));
        this.yMax = Math.ceil(this.options.apiYMax + ((this.options.apiYMax - this.options.apiYMin) * 0.05));
        this.xMin = 0;
        this.xMin = Math.floor(this.options.apiXMin - ((this.options.apiXMax - this.options.apiXMin) * 0.05));
        this.yMin = Math.floor(this.options.apiYMin - ((this.options.apiYMax - this.options.apiYMin) * 0.05));

        this.xscope = this.xMax - this.xMin;
        this.yscope = this.yMax - this.yMin;
        // X AXIS
        this.xAxis.printTitle(this.options.xTitle);
        if (this.drawMinMaxLines) {
            this.xAxis.drawLine(this.options.apiXMax, 'text', '#6767cc', 0.7);
            this.xAxis.drawLine(this.options.apiXMin, 'text', '#6767cc', 0.7);
        }
        // Y AXIS
        this.yAxis.printTitle(this.options.yTitle);
        if (this.drawMinMaxLines) {
            this.yAxis.drawLine(this.options.apiYMax, 'text', '#6767cc', 0.7);
            this.yAxis.drawLine(this.options.apiYMin, 'text', '#6767cc', 0.7);
        }

        // set scatter dot color

        //iterate
        this.options.chartData.each(function (elm) {
            var xScaled = self.scaleX(elm[0]);
            var yScaled = self.scaleY(elm[1]);
            //draw dots
            self.canvas.circle(xScaled, yScaled, 3, true, self.scatterColor, self.scatterColor, 0.5);
        });

        this.drawAPIScatterCurve();
        this.setScatterListeners();

    },

    drawScatterGraph: function () {
        var self = this;
        this.scatterColor = this.options.color;

        this.hashGrid = {};
        this.options.apiXMax = parseFloat(this.options.apiXMax);
        this.options.apiXMin = parseFloat(this.options.apiXMin);
        this.options.apiYMax = parseFloat(this.options.apiYMax);
        this.options.apiYMin = parseFloat(this.options.apiYMin);

        this.xMax = Math.ceil(this.options.apiXMax + ((this.options.apiXMax - this.options.apiXMin) * this.paddingFactor));
        this.xMin = 0;
        this.xMin = Math.floor(this.options.apiXMin - ((this.options.apiXMax - this.options.apiXMin) * this.paddingFactor));

        this.yMax = Math.ceil(this.options.apiYMax + ((this.options.apiYMax - this.options.apiYMin) * this.paddingFactor));
        this.yMin = Math.floor(this.options.apiYMin - ((this.options.apiYMax - this.options.apiYMin) * this.paddingFactor));

        //scope
        this.xscope = this.xMax - this.xMin;
        this.yscope = this.yMax - this.yMin;


        this.yMaxScaled = this.scaleY(this.options.apiYMax);
        this.yMinScaled = this.scaleY(this.options.apiYMin);

        this.xMaxScaled = this.scaleX(this.options.apiXMax);
        this.xMinScaled = this.scaleX(this.options.apiXMin);


        if (this.drawScatterGrid) {
            for (var i = this.xMinScaled; i < this.xMaxScaled; i += this.hashGridSize) {
                this.canvas.line(i + 0.5, this.yMinScaled, i + 0.5, this.yMaxScaled, '#515151', 0.1);
            }
            for (var j = this.yMaxScaled; j < this.yMinScaled; j += this.hashGridSize) {
                this.canvas.line(this.xMinScaled, j + 0.5, this.xMaxScaled, j + 0.5, '#515151', 0.1);
            }
        }


        // X AXIS
        this.xAxis.printTitle(this.options.xTitle);
        this.xAxis.drawLine(this.options.apiXMax, 'text', '6767cc', 0.4);
        this.xAxis.drawLine(this.options.apiXMin, 'text', '6767cc', 0.4);

        var avgXScaled = this.scaleX(this.options.avgX);
        var medXScaled = this.scaleX(this.options.medX);
        this.canvas.line(avgXScaled + 0.5, this.yMinScaled, avgXScaled + 0.5, this.yMaxScaled, '#ff6600', 0.45);
        this.canvas.line(medXScaled + 0.5, this.yMinScaled, medXScaled + 0.5, this.yMaxScaled, '#acacff', 0.45);
        var awidth = get_textWidth(avgXScaled.toString(), 8);
        var mwidth = get_textWidth(medXScaled.toString(), 8);
        this.canvas.text(medXScaled.toString(), medXScaled - mwidth / 2, this.yMaxScaled - 12, 8, '#acacff', 0.4);
        this.canvas.text(avgXScaled.toString(), avgXScaled - awidth / 2, this.yMaxScaled - 12, 8, '#ff6600', 0.4);


        // Y AXIS
        this.yAxis.printTitle(this.options.yTitle);
        this.yAxis.drawLine(this.options.apiYMax, 'max', '6767cc', 0.4);
        this.yAxis.drawLine(this.options.apiYMin, 'min', '6767cc', 0.4);


        var avgYScaled = this.scaleY(this.options.avgY);
        var medYScaled = this.scaleY(this.options.medY);
        this.canvas.line(this.xMinScaled, avgYScaled + 0.5, this.xMaxScaled, avgYScaled + 0.5, '#ff6600', 0.45);
        this.canvas.line(this.xMinScaled, medYScaled + 0.5, this.xMaxScaled, medYScaled + 0.5, '#acacff', 0.45);

        this.canvas.text(medYScaled.toString(), this.xMaxScaled + 1, medYScaled - 5, 8, '#acacff', 0.4);
        this.canvas.text(avgYScaled.toString(), this.xMaxScaled + 1, avgYScaled - 5, 8, '#ff6600', 0.4);

        // Z VALUES
        if (typeof(this.options.scatterFields[2]) != 'undefined') {
            console.log(typeof(this.options.scatterFields[2]))
            this.options.apiZMin = this.getScatterMinValue(2);
            this.options.apiZMax = this.getScatterMaxValue(2);
            this.drawZLegend();

        }

        var timeoutFunction = function () {
            self.drawScatterGraphData(0);
        };
        this.timer = setTimeout(timeoutFunction, 10);

    },
    drawScatterGraphData: function (start) {


        var self = this;


        var size = this.scatterChunkSize + start;

        if (size > (this.options.numResults)) {
            size = (this.options.numResults);
        }

        //console.log(size);
        var em = [];
        for (var i = start; i < size; i++) {
            em = this.options.chartData[i];

            var xScaled = this.scaleX(em[0]);
            var yScaled = this.scaleY(em[1]);
            var dotRadius = self.getScatterDotRadius(em);
            self.assignToGrid(xScaled, yScaled, self.options.keys[i]);
            //draw dots

            self.canvas.circle(xScaled + 0.5, yScaled + 0.5, dotRadius, true, self.scatterColor, self.scatterColor, 0.45, 0);
        }

        if ((size) < this.options.numResults) {
            var timeoutFunc = function () {
                self.drawScatterGraphData(i);
            };
            this.timer = setTimeout(timeoutFunc, 20);
        } else {

            console.log('scatter graph done');
            //TIMER.dumpTimer();
        }
        this.setScatterListeners();
    },

    getScatterDotRadius:function(element) {

        var x = this.dotRadius;

        if (typeof(element[2]) !== 'undefined') {

            x = this.scaleToRange(element[2], this.options.apiZMin, this.options.apiZMax, this.dotMinRadius, this.dotMaxRadius);
        }
        return x;
    },

    drawZLegend:function() {
        var data = this.options.chartDataRaw._object[this.options.scatterFields[2]];


        var zMin = [0,0,Math.round(parseFloat(data.min) * 100, 2) / 100];
        var zMax = [0,0,Math.round(parseFloat(data.max) * 100, 2) / 100];
        var zAvg = [0,0,Math.round(parseFloat(data.average) * 100, 2) / 100];
        var zMed = [0,0,Math.round(parseFloat(data.median) * 100, 2) / 100];

        var h = 0;
        var pcx = 0
        var ptx = 0;
        var radius = this.getScatterDotRadius(zMax);
        var centerX = this.xMaxScaled - radius;
        var centerY = this.yMaxScaled + radius;
        this.canvas.circle(centerX, centerY, radius, true, this.scatterColor, '000000', 0.2, 0);
        this.canvas.text(zMax[2].toString(), centerX + radius + 5, centerY - 5, 8, '#676767', 0.8);
        h += radius;
        pcx = centerX;
        ptx = centerX + radius + 5;
        this.assignToGrid(centerX, centerY, 'Max: ' + zMax[2].toString())

        radius = this.getScatterDotRadius(zAvg);
        centerX = pcx;
        centerY = this.yMaxScaled + radius + (h * 2) + 5;
        this.canvas.circle(centerX, centerY, radius, true, 'ff6600', '000000', 0.2, 0);
        this.canvas.text(zAvg[2].toString(), ptx, centerY - 5, 8, '#676767', 0.8);
        h += radius + 5;
        this.assignToGrid(centerX, centerY, 'Average: ' + zAvg[2].toString())


        radius = this.getScatterDotRadius(zMed);
        centerX = pcx;
        centerY = this.yMaxScaled + radius + (h * 2) + 5;
        this.canvas.circle(centerX, centerY, radius, true, 'acacff', '000000', 0.2, 0);
        this.canvas.text(zMed[2].toString(), ptx, centerY - 5, 8, '#676767', 0.8);
        h += radius + 5;
        this.assignToGrid(centerX, centerY, 'Median: ' + zMed[2].toString())

        radius = this.getScatterDotRadius(zMin);
        centerX = pcx;
        centerY = this.yMaxScaled + radius + (h * 2) + 5;
        this.canvas.circle(centerX, centerY, radius, true, this.scatterColor, '000000', 0.2, 0);
        this.canvas.text(zMin[2].toString(), ptx, centerY - 5, 8, '#676767', 0.8);
        h += radius + 5;
        this.assignToGrid(centerX, centerY, 'Min: ' + zMin[2].toString())

        console.log(zMin, zMax, zMed, zAvg, radius);
    },

    scaleToRange:function(oldValue, oldMin, oldMax, newMin, newMax) {
        var x = (((oldValue - oldMin) / (oldMax - oldMin)) * (newMax - newMin) + newMin);
        return x;
    },

    assignToGrid:function(x, y, value) {


        var xm = Math.ceil((x - this.xMinScaled) / this.hashGridSize);
        var ym = Math.floor((y - this.yMaxScaled) / this.hashGridSize);

        if (typeof(this.hashGrid[xm + '-' + ym]) != 'undefined') {
            this.hashGrid[xm + '-' + ym].values.push(value);
        } else {
            this.hashGrid[xm + '-' + ym] = {'values':[value]};
        }

    },

    fetchFromGridHash:function(x, y) {
        var xm = Math.ceil((x - this.xMinScaled) / this.hashGridSize);
        var ym = Math.floor((y - this.yMaxScaled) / this.hashGridSize);

        if (typeof(this.hashGrid[xm + '-' + ym]) != 'undefined') {
            return this.hashGrid[xm + '-' + ym].values;
        } else {
            return [];
        }
    },

    detectNegative:function() {

        this.hasNegative = false;
        var self = this;
        this.options.chartData.each(function(element) {
            if (element < 0) {
                self.hasNegative = true;
                throw $break;
            }
        });

    },

    // DRAW LINE GRAPH
    // !! PLEASE !! provide array of integers in this.options.data
    drawGenericGraph:function() {
        var self = this;

        this.detectNegative();
        //get scope and min/max values


        this.paddingFactor = 0;
        if (this.options.type == 'line') {
            this.paddingFactor = 0.0;
        }

        this.getDataScope();

        if (!this.hasNegative && (this.options.type == 'bars' || this.options.type == 'complexHistogram')) {
            //we are drawing from the zero
            this.yMin = 0;
            this.yscope = this.yMax - this.yMin;
        }

        this.availableCanvasWidth = this.scaleX(this.xMax) - this.scaleX(this.xMin);
        this.drawMinMaxLines = false;

        var xMinTitle = '';
        var xMaxTitle = '';
        if (typeof(this.options.timestamps) != 'undefined') {
            this.options.timestamps = this.options.timestamps.reverse(false);

            var date = new Date();
            //start time
            date.setTime(this.options.timestamps[0]);
            xMinTitle = this.pad(date.getHours()) + ":" + this.pad(date.getMinutes());

            //end time
            date.setTime(this.options.timestamps[this.options.timestamps.length - 1]);
            xMaxTitle = this.pad(date.getHours()) + ":" + this.pad(date.getMinutes());
        } else {
            xMinTitle = this.xMin;
            xMaxTitle = this.xMax;
        }

        // X AXIS
        this.xAxis.printTitle(this.options.xTitle);
        this.xAxis.drawLine(this.xMax, xMaxTitle, '6767cc', 0.4);
        this.xAxis.drawLine(this.xMin, xMinTitle, '6767cc', 0.4);


        // Y AXIS
        this.yAxis.printTitle(this.options.yTitle);
        this.yAxis.drawLine(this.yMax, 'max', '6767cc', 0.4);
        this.yAxis.drawLine(this.yMin, 'min', '6767cc', 0.4);


        if (this.options.type == 'bars') {
            this.drawBars();
        }

        if (this.options.type == 'line') {
            this.drawLineGraph();
        }

        if (this.options.type == 'complexHistogram') {


            this.drawComplexHistogram(false, false);
            this.hoverHandler = this.options.hoverHandler;
            Event.observe(this.canvas.canvasElement, 'mousemove', this.options.hoverFunction);
            Event.observe(this.canvas.canvasElement, 'mouseout', function() {
                self.clearDrawingArea();
                self.drawComplexHistogram(false, false);
            });


        }


    },

    drawGenericMultiple:function(){
        
        var data = this.options.chartData;
        var firstEntry = this.options.chartData[0];
        var self = this;
        var fields = [];

        this.yMaxArray = [];
        this.yMinArray = [];
        
        for(var fieldName in firstEntry){
            fields.push(fieldName);
        }

        self.options.chartData = [];
        fields.each(function(field){
            //console.log(field);
            var tmpData = [];
            data.each(function(entry){
                tmpData.push(entry[field]);
            });
            self.yMaxArray.push(tmpData.max());
            self.yMinArray.push(tmpData.min());
            self.options.chartData.push({"name":field,"values": tmpData});


        });
        self.drawMultipleLineGraph();

    },

    drawMultipleLineGraph:function() {
        //console.log(this.options.chartData);

        this.xMin = 0;
        this.xMax = this.options.chartData[0].values.length;

        this.yMin = this.yMinArray.min();
        this.yMax = this.yMaxArray.max();

        this.getDataScope(true);

        if (!this.hasNegative && (this.options.type == 'bars' || this.options.type == 'complexHistogram')) {
            //we are drawing from the zero
            this.yMin = 0;
            this.yscope = this.yMax - this.yMin;
        }

        this.availableCanvasWidth = this.scaleX(this.xMax) - this.scaleX(this.xMin);
        this.drawMinMaxLines = false;

        var xMinTitle = '';
        var xMaxTitle = '';
        if (typeof(this.options.timestamps) != 'undefined') {
            this.options.timestamps = this.options.timestamps.reverse(false);

            var date = new Date();
            //start time
            date.setTime(this.options.timestamps[0]);
            xMinTitle = this.pad(date.getHours()) + ":" + this.pad(date.getMinutes());

            //end time
            date.setTime(this.options.timestamps[this.options.timestamps.length - 1]);
            xMaxTitle = this.pad(date.getHours()) + ":" + this.pad(date.getMinutes());
        } else {
            xMinTitle = this.xMin;
            xMaxTitle = this.xMax;
        }

        // X AXIS
        this.xAxis.printTitle(this.options.xTitle);
        this.xAxis.drawLine(this.xMax, xMaxTitle, '6767cc', 0.4);
        this.xAxis.drawLine(this.xMin, xMinTitle, '6767cc', 0.4);


        // Y AXIS
        this.yAxis.printTitle(this.options.yTitle);
        this.yAxis.drawLine(this.yMax, 'max', '6767cc', 0.4);
        this.yAxis.drawLine(this.yMin, 'min', '6767cc', 0.4);

        //console.log("min max scope");
        //console.log(this.xMin, this.xMax,this.yMin +' yMax: ' +this.yMax);
       // console.log(this.xMin,this.xMax,this.yMin,this.yMax);
        var self = this;
        var len = this.options.chartData[0].values.length;

        this.options.chartData.each(function(mData){
            var data = mData.values.reverse(false);
            var field = mData.name;
            var x = 0;
            var xNext = 0;
            var y = 0;
            var yNext = 0;

            self.canvas.setLineWidth(self.options.lineWidth);

            data.each(function(elm, index) {
                if (index < len - 1) {
                    x = self.scaleX(index) + 0.5;
                    y = self.scaleY(elm);
                    
                    xNext = self.scaleX(index + 1) + 0.5;
                    yNext = self.scaleY(data[index + 1]);

                    self.canvas.line(x, y, xNext, yNext, self.options.color[field], 0.6);
                }
                
            });

        });

    },


    drawLineGraph:function() {
        var self = this;
        var len = this.options.chartData.length;
        var data = this.options.chartData.reverse(false);

        var x = 0;
        var xNext = 0;
        var y = 0;
        var yNext = 0;

        self.canvas.setLineWidth(self.options.lineWidth);

        data.each(function(elm, index) {

            if (index < len - 1) {
                x = self.scaleX(index) + 0.5;
                y = self.scaleY(elm);

                xNext = self.scaleX(index + 1) + 0.5;
                yNext = self.scaleY(data[index + 1]);

                self.canvas.line(x, y, xNext, yNext, self.options.color, 0.6);
            }
        });

    },


    drawBars:function() {
        var self = this;
        this.options.chartData = this.options.chartData.reverse(false);
        var x = 0;
        var y = 0;
        var yZero = this.scaleY(self.yMin);
        var xMaxScaled = this.scaleX(this.xMax);
        var xMinScaled = this.scaleX(this.xMin);

        var barWidth = (xMaxScaled - xMinScaled - 2) / this.options.chartData.length;
        if (barWidth < 1) {
            barWidth = 1;
        }

        if (barWidth >= 2) {
            barWidth -= 1.5;
        }

        var halfBar = barWidth / 2;

        this.options.chartData.each(function(elm, index) {

            x = self.scaleX(index) + 0.5;
            y = self.scaleY(elm);

            //console.log(x);
            //self.canvas.line(x, y, x, yZero, '#7878cc', 0.8);
            self.canvas.poly2d([
                [x,y],
                [x + barWidth,y],
                [x + barWidth,yZero],
                [x,yZero]
            ], self.options.color, 0.7);
            if (self.options.drawXLabels) {
                self.canvas.text(self.options.chartXLabels[index].toString(), x + halfBar - 5, yZero + 5, 8, '#676767', 0.9);
                self.canvas.text(elm, x + halfBar - 5, y - 10, 8, '#676767', 0.8);
            }

        });

    },

    drawComplexHistogram:function(mouseX, mouseY) {
        var self = this;
        this.complexHistogramMouseY = mouseY;
        var x = 0;
        var y = 0;
        var yZero = this.scaleY(self.yMin) - 1;
        var xMaxScaled = this.scaleX(this.xMax);
        var xMinScaled = this.scaleX(this.xMin);
        var yMaxScaled = this.scaleY(this.yMax);

        var barWidth = (xMaxScaled - xMinScaled - 2) / this.options.chartData.length;
        if (barWidth < 1) {
            barWidth = 1;
        }

        if (barWidth >= 3) {
            barWidth -= 1.5;
        }

        this.clearX = xMinScaled;
        this.clearY = yMaxScaled;
        this.clearW = xMaxScaled;
        this.clearH = yZero;


        var halfBar = barWidth / 2;

        var barColor = self.options.color;


        this.options.chartData.each(function(elm, index) {

            x = self.scaleX(index) + 0.5;
            y = self.scaleY(elm);

            if (mouseX) {

                if ((mouseX > x) && (mouseX <= (x + barWidth))) {
                    self.hoverHandler({"element":elm,"label":self.options.chartXLabels[index],"index":index});
                    barColor = self.options.hoverColor;
                } else {
                    barColor = self.options.color;
                }
            }

            //console.log(x);
            //self.canvas.line(x, y, x, yZero, '#7878cc', 0.8);
            self.canvas.poly2d([
                [x,y],
                [x + barWidth,y],
                [x + barWidth,yZero],
                [x,yZero]
            ], barColor, 0.7);
            if (self.options.drawXLabels && !self.firstPass) {
                var textWidth = get_textWidth(self.options.chartXLabels[index], 7);
                self.canvas.text(self.options.chartXLabels[index], x + halfBar - (textWidth / 2), yZero + 5, 7, '#676767', 0.9);
            }
            self.canvas.text(elm.toString(), x + halfBar - 5, y - 12, 8, '#676767', 0.8);


        });

        self.firstPass = true;

    },


    // GET DATA SCOPE
    getDataScope:function(multiple) {
        if(typeof(multiple) == 'undefined'){
            // get min and max values
            this.xMin = 0;
            this.yMin = this.options.chartData.min();
            this.xMax = this.options.chartData.length;
            this.yMax = this.options.chartData.max();
        }
        
        if (this.forceScope) {
            this.yMax = this.forceMaxValue;
            this.yMin = this.forceMinValue;
        }

        if (this.yMax == this.yMin && this.yMax !== 0) {
            this.yMin = 0;
        }

        if (this.yMax == this.yMin && this.yMax === 0) {
            this.yMin = 0;
            this.yMax = 2;
        }

        this.xscope = this.xMax - this.xMin;
        this.yscope = this.yMax - this.yMin;

        this.yMax = this.yMax + ((this.yMax - this.yMin) * this.paddingFactor);
        if (this.yMin === 0) {
            this.paddingFactor = 0;
        }
        this.yMin = Math.floor(this.yMin - ((this.yMax - this.yMin) * this.paddingFactor));


        this.yscope = this.yMax - this.yMin;

    },



    drawAPIScatterCurve: function () {
        var self = this;
        var len = this.options.curve.length;
        this.canvas.setLineWidth(1);
        this.options.curve.each(function (elm, idx) {

            if (idx < len - 1) {
                var x = elm[0];
                var y = elm[1];

                var nextX = self.options.curve[idx + 1][0];
                var nextY = self.options.curve[idx + 1][1];

                var xScaled = self.scaleX(x);
                var yScaled = self.scaleY(y);

                var nextXScaled = self.scaleX(nextX);
                var nextYScaled = self.scaleY(nextY);

                self.canvas.line(xScaled, yScaled, nextXScaled, nextYScaled, '#ff0000', 0.7);
            }
        });

    },

    scaleX: function (x) {
        return Math.round((this.canvasWidth - (this.leftPadding + this.rightPadding)) - ((this.xMax - x) / this.xscope * (this.canvasWidth - this.leftPadding - this.rightPadding)) + (this.leftPadding));
    },

    scaleY: function (y) {
        //console.log('scaling '+y);
        //console.log(this.yMax,this.yscope,this.canvasHeight,this.topPadding,this.bottomPadding);
        return Math.round(((this.yMax - y) / this.yscope * (this.canvasHeight - this.topPadding - this.bottomPadding)) + this.topPadding);

    },

    reverseScaleX:function(x) {


        var shift = 1 - this.xMaxScaled;
        var shiftedX = x + shift;

        var range = this.options.apiXMax - this.options.apiXMin;
        var onePixel = range / (this.xMinScaled + shift);
        var scaled = 0;

        if (x >= this.xMinScaled && x <= this.xMaxScaled) {
            scaled = Math.round(onePixel * ((this.xMinScaled + shift) - shiftedX)) + this.options.apiXMin;
        } else {
            scaled = 'unknown';
        }

        return scaled;

    },

    reverseScaleY:function(y) {

        var shift = 1 - this.yMaxScaled;
        var shiftedY = y + shift;

        var range = this.options.apiYMax - this.options.apiYMin;
        var onePixel = range / (this.yMinScaled + shift);
        var scaled = 0;

        if (y <= this.yMinScaled && y >= this.yMaxScaled) {
            scaled = Math.round(onePixel * ((this.yMinScaled + shift) - shiftedY)) + this.options.apiYMin;
        } else {
            scaled = 'unknown';
        }

        return scaled;

    },
    setScatterListeners: function () {

        var self = this;
        this.tooltip = $(this.options.tooltip);
        Event.observe($(this.options.canvasID), 'mousemove', function (e) {
            var elm = Event.element(e);
            var offset = elm.cumulativeOffset();

            var top = e.pointerY() - offset.top;
            var left = e.pointerX() - offset.left;
            self.drawScatterTooltip(top, left);
        });

        //Event.observe($(this.options.canvasID), 'mouseover', function (e) {
        //    self.tooltip.show();

        //});

        //Event.observe($(this.options.canvasID), 'mouseout', function (e) {
        //    self.tooltip.hide();

        //});

    },

    drawScatterTooltip: function (top, left) {

        this.tooltip = $(this.options.tooltip);
        var values = this.fetchFromGridHash(left, top).join(', ');
        if (values != '') {
            this.tooltip.show();
        } else {
            this.tooltip.hide();
        }
        this.tooltip.innerHTML = 'test test';
        this.tooltip.style.top = top - 20 + 'px';
        this.tooltip.style.left = left + 20 + 'px';
        this.tooltip.innerHTML = '<b>' + this.options.xTitle + '</b>: ' + this.reverseScaleX(left) + '<br><b>' + this.options.yTitle + '</b>: ' + this.reverseScaleY(top) + ' <br/> <b>values:</b> ' + values;
    },

    getScatterXMaxValue: function () {
        var xMax = this.options.chartData[0][0];
        this.options.chartData.each(function (val) {
            if (val[0] > xMax) {
                xMax = val[0];
            }
        });
        return xMax;
    },

    getScatterYMaxValue: function () {
        var yMax = this.options.chartData[0][1];
        this.options.chartData.each(function (val) {
            if (val[1] > yMax) {
                yMax = val[1];
            }
        });

        return yMax;
    },
    getScatterXMinValue: function () {
        var xMin = this.options.chartData[0][0];
        this.options.chartData.each(function (val) {
            if (val[0] < xMin) {
                xMin = val[0];
            }
        });
        return xMin;
    },

    getScatterYMinValue: function () {
        var yMin = this.options.chartData[0][1];
        this.options.chartData.each(function (val) {
            if (val[1] < yMin) {
                yMin = val[1];
            }
        });
        return yMin;
    },


    getScatterMinValue: function (index) {
        var tmpMin = this.options.chartData[0][index];
        this.options.chartData.each(function (val) {
            if (val[index] < tmpMin) {
                tmpMin = val[index];
            }
        });
        return tmpMin;
    },

    getScatterMaxValue: function (index) {
        var tmpMax = this.options.chartData[0][index];
        this.options.chartData.each(function (val) {
            if (val[index] > tmpMax) {
                tmpMax = val[index];
            }
        });

        return tmpMax;
    },



    dbg: function () {
        console.log(this);
    },

    pad:function(n){
            return n<10 ? '0'+n : n;
    }
});

var xAxis = Class.create(ChartEngine, {
    initialize: function (self) {
        this.chart = self;
    },
    //draw x axis
    draw: function () {
        this.chart.canvas.line(this.chart.leftPadding - 10, (this.chart.canvasHeight - this.chart.bottomPadding), this.chart.canvasWidth - this.chart.rightPadding, (this.chart.canvasHeight - this.chart.bottomPadding), this.chart.axisColor, this.chart.axisOpacity);
    },
    //print x axis max
    printMax: function (val) {
        //this.chart.canvas.text(val.toString(), this.chart.canvasWidth - this.chart.rightPadding - 20, (this.chart.canvasHeight - this.chart.bottomPadding + 10), 8, '#414141', 0.9);
    },
    // print x axis min
    printMin: function (val) {
        this.chart.canvas.text(val.toString(), this.chart.leftPadding, (this.chart.canvasHeight - this.chart.bottomPadding + 10), 8, '#414141', 0.9);
    },
    // draw x axis title
    printTitle: function (title) {
        this.chart.canvas.text(title.toString(), (this.chart.canvasWidth / 2) - this.chart.rightPadding - 20, (this.chart.canvasHeight - this.chart.bottomPadding + 18), 8, '#414141', 0.9);
    },
    drawLine: function (h, text, color, alpha) {
        //scale coordinates
        var y = this.chart.canvasHeight - this.chart.bottomPadding;
        var xScaled = this.chart.scaleX(h) + 0.5;
        //draw line
        if (this.chart.drawMinMaxLines) {
            this.chart.canvas.line(xScaled, y, xScaled, this.chart.topPadding, color, alpha);
        }
        var textWidth = get_textWidth(h.toString(), 8);
        this.chart.canvas.text(text.toString(), xScaled - (textWidth / 2) -6, this.chart.canvasHeight - 16, 8, color, alpha);
    }
});

//
// Y AXIS
//
var yAxis = Class.create(ChartEngine, {
    initialize: function (self) {
        this.chart = self;
    },

    scaleX: function ($super, x) {

        return $super(x);
    },

    scaleY: function ($super, y) {

        return $super(y);
    },
    //draw y axis
    draw: function () {
        this.chart.canvas.line(this.chart.leftPadding, 15, this.chart.leftPadding, this.chart.canvasHeight - this.chart.bottomPadding + 10, this.chart.axisColor, this.chart.axisOpacity);
    },

    printMax: function (val) {
        this.chart.canvas.text(val.toString(), 5, 5, 8, '#414141', 0.9);
    },

    printMin: function (val) {
        this.chart.canvas.text(val.toString(), 5, (this.chart.canvasHeight - this.chart.bottomPadding) - 15, 8, '#414141', 0.9);
    },
    //write vertical title
    printTitle: function (val) {
        this.chart.canvas.text(val.toString(), 5, ((this.chart.canvasHeight / 2) - this.chart.bottomPadding) - 15, 8, '#414141', 0.9, 90);
    },

    drawLine: function (h, type, color, alpha) {

        var hOffset = 0;

        if (type == 'max') {
            hOffset = +21;
        }

        if (type == 'min') {
            hOffset = -1;
        }


        //scale
        var x = this.chart.leftPadding;
        var yScaled = this.chart.scaleY(h) + 0.5;
        //draw line
        if (this.chart.drawMinMaxLines) {
            this.chart.canvas.line(x, yScaled, (this.chart.canvasWidth - this.chart.rightPadding), yScaled, color, alpha);
        }
        this.chart.canvas.text(h.toString(), 4, yScaled - hOffset, 8, color, alpha);

    }
});