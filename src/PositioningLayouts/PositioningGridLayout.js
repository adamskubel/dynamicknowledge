define(function(require, exports, module) {
    var GridLayout = require('famous/views/GridLayout');

    /**
     * A surface containing image content.
     *   This extends the Surface class.
     *
     * @class ImageSurface
     *
     * @extends Surface
     * @constructor
     * @param {Object} [options] overrides of default options
     */
    function PositioningGridLayout(options) {
        GridLayout.apply(this, arguments);
    }
    PositioningGridLayout.prototype = Object.create(GridLayout.prototype);
    PositioningGridLayout.prototype.constructor = PositioningGridLayout;

    PositioningGridLayout.prototype.calculateChildPosition = function calculateChildPosition(child)
    {
        var parentPosition = this.calculatePosition();

        var index = this.sequence.indexOf(child);


        var xIndex = index % this.options.dimensions[0];
        var yIndex = index / this.options.dimensions[0];

        var cellSize = this.calculateChildSize();
        var myOffset = [cellSize[0]*xIndex,cellSize[1]*yIndex];
        var childPosition = [parentPosition[0]+myOffset[0],parentPosition[1]+myOffset[1]];
        
        // if (isNan(childPosition[0]) || isNan(childPosition[1]))
        // {
        //     console.log('Index = ' + index);
        //     console.log('CellSize: ' + cellSize);
        //     console.log('Offset: ' +  myOffset);
        //     console.log('ParentPos: ' + parentPosition);
        // }   

        return childPosition;
    };

    PositioningGridLayout.prototype.calculateChildSize = function calculateChildSize(child) {
        var ownerSize = this.calculateSize();
        var cellSize = [ownerSize[0]/this.options.dimensions[0],ownerSize[1]/this.options.dimensions[1]];
        return cellSize;
    };

    PositioningGridLayout.prototype.calculateSize = function calculateSize(){

        if (this.owner != undefined && this.owner.calculateChildSize != undefined)
        {
            return this.owner.calculateChildSize(this);
        }
        else
        {
            return this._contextSizeCache;
        }
    };
    
    PositioningGridLayout.prototype.calculatePosition = function calculatePosition(){

        // if (this.owner != undefined && this.owner.calculateChildSize != undefined)
        // {
            return this.owner.calculateChildPosition(this);
        // }
        // else
        // {
        //     return [0,0];
        // }
    };

    PositioningGridLayout.prototype.setChildren = function(children) {
        var newChildren = [];
        this.sequenceFrom(newChildren);

        for (var i=0;i<children.length;i++)
        {
            children[i].owner = this;
            children[i].calculateSize = function() {
                return this.owner.calculateChildSize(this);
            };
            children[i].calculatePosition = function() {
                return this.owner.calculateChildPosition(this);
            };

            newChildren.push(children[i]);
        }

    };


    module.exports = PositioningGridLayout;
});
