define(function(require, exports, module) {


    var FlexibleLayout = require('famous/views/FlexibleLayout');
    var PositionableView = require('./PositionableView');

    var childArray;
    var flexLayout;

    function PositioningFlexibleLayout(options) {
        PositionableView.call(this, options);

        flexLayout = new FlexibleLayout({
            ratios: this.options.ratios,
            direction: this.options.direction
        });

        childArray = [];
        flexLayout.sequenceFrom(childArray);

        this.add(flexLayout);
    }

    PositioningFlexibleLayout.DEFAULT_OPTIONS = {
        ratios:[1],
        direction:0
    }

    PositioningFlexibleLayout.prototype = Object.create(PositionableView.prototype);
    PositioningFlexibleLayout.prototype.constructor = PositioningFlexibleLayout;


    PositioningFlexibleLayout.prototype.childControlsPosition = function()
    {
        return false;
    };

    PositioningFlexibleLayout.prototype.calculateChildPosition = function calculateChildPosition(child)
    {
        var parentPosition = this.calculatePosition();

        var index = this._nodes.indexOf(child);


        var dir = this.options.direction;
        var myOffset = [0,0];
        for (var i=0;i<index;i++)
        {
            var cellSize = this.calculateChildSize(this._nodes[i]);
            myOffset[dir] += cellSize[dir];
        }
        
        var childPosition = [parentPosition[0]+myOffset[0],parentPosition[1]+myOffset[1]];
        
      
        //console.log('Index = ' + index);
        //console.log('CellSize: ' + cellSize);
        //console.log('Offset: ' +  myOffset);


        return childPosition;
    };

    PositioningFlexibleLayout.prototype.calculateChildSize = function calculateChildSize(child) {

        var index = this._nodes.indexOf(child);
        var ownerSize = this.calculateSize();
        var dir = this.options.direction;

        var ratios = this.options.ratios;
        var ratioSum = 0;
        for (var i = 0; i < ratios.length; i++)
        {
            ratioSum += ratios[i];
        }

        var normalizedRatio = ratios[index]/ratioSum;

        // console.log('ChildIndex: ' + index);
        // console.log('OwnerSize: ' + ownerSize);

        if (dir == 0)
            return [ownerSize[0]*normalizedRatio,ownerSize[1]];
        else
            return [ownerSize[0],ownerSize[1]*normalizedRatio];        
    };

    PositioningFlexibleLayout.prototype.calculateSize = function calculateSize(){
        return this.owner.calculateChildSize(this);
    };
    
    PositioningFlexibleLayout.prototype.calculatePosition = function calculatePosition(){
       return this.owner.calculateChildPosition(this);
    };


    //PositioningFlexibleLayout.prototype.setChildren = function(children) {
    //    var newChildren = [];
    //    this.sequenceFrom(newChildren);
    //
    //    for (var i=0;i<children.length;i++)
    //    {
    //        children[i].owner = this;
    //        children[i].calculateSize = function() {
    //            return this.owner.calculateChildSize(this);
    //        };
    //        children[i].calculatePosition = function() {
    //            return this.owner.calculateChildPosition(this);
    //        };
    //
    //        newChildren.push(children[i]);
    //    }
    //
    //};

    PositioningFlexibleLayout.prototype.addChild = function(child){

        childArray.push(child);
        child.parent = this;
    };

    module.exports = PositioningFlexibleLayout;
});
