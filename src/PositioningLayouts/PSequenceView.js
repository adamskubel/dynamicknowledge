define(function(require, exports, module) {

    var SequenceView = require('famous/views/SequentialLayout');
    var PositionableView = require('./PositionableView');
    var View = require('famous/core/View');
    var Vector = require('../ProperVector');
    var Utils = require('../Utils');

    function PSequenceView(options) {
        PositionableView.call(this, options);

        this.sequenceView = new SequenceView({
            direction: this.options.direction,
            friction: 0.5
        });

        this.children = [];
        this.sequenceView.sequenceFrom(this.children);
        this.lastOffset = 0;

        this.add(this.sequenceView);
    }

    PSequenceView.DEFAULT_OPTIONS = {
        direction:0,
        position:[0,0,0]
    }

    PSequenceView.prototype = Object.create(PositionableView.prototype);
    PSequenceView.prototype.constructor = PSequenceView;

    PSequenceView.prototype.calculateChildPosition = function calculateChildPosition(child)
    {
        var parentPosition = Vector.fromArray(this.calculatePosition());
        var index = this.indexOfChild(child);

        var dir = this.options.direction;

        var dirVector = Utils.getDirectionVector(dir);

        //parentPosition = parentPosition.sub(dirVector.multiply(Math.round(this.sequenceView._displacement)));

        var myOffset = [0,0];

        for (var i=0;i<index;i++)
        {
            var cellSize = this.calculateChildSize(this.children[i]._view);
            myOffset[dir] += cellSize[dir];
        }

        var childPosition = parentPosition.add(Vector.fromArray(myOffset));

        return childPosition.toArray();
    };

    PSequenceView.prototype.calculateChildSize = function calculateChildSize(child){
        return child.measure().maximumSize;
    };

    PSequenceView.prototype.measure = function(){

        for (var i=0;i<this.children.length;i++){
            var child = this.children[i]._view;
            child._dynamicSize = child.measure().maximumSize;
        }

        return {
            minimumSize: this.size,
            maximumSize: this.size
        }
    };

    PSequenceView.prototype.layout = function(layoutSize){

        for (var i=0;i<this.children.length;i++){
            var child = this.children[i]._view;
            child.layout(child._dynamicSize);
        }

        PositionableView.prototype.layout.call(this,layoutSize);
    };

    PSequenceView.prototype.needsLayout = function()
    {
        if (this._layoutDirty)
            return true;

        for (var i=0;i<this.children.length;i++)
        {
            if (this.children[i]._view.needsLayout())
                return true;
        }

        return false;
    };

    PSequenceView.prototype.indexOfChild = function(child){
        return this.children.indexOf(child._wrap);
    };

    PSequenceView.prototype.addChild = function(child, config){

        var wrap = new View();
        wrap._view = child;
        wrap.add(child.getModifier()).add(child);
        child._wrap = wrap;

        if (child.textSurface && child.backSurface){
            child.textSurface.pipe(this.sequenceView);
            child.backSurface.pipe(this.sequenceView);
        }

        if (config && config.index)
            this.children.splice(config.index,0,wrap);
        else
            this.children.push(wrap);


        this.requestLayout();
        child.parent = this;
    };

    module.exports = PSequenceView;
});
