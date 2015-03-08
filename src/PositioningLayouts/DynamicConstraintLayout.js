define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var PositionableView = require('./PositionableView');
    var Vector = require('ProperVector');
    var Rect = require('Utils/Rect');

	function DynamicConstraintLayout(options)
	{
		PositionableView.call(this, options);

        this.children = [];

        this.minimumContainerSize = this.options.minimumContainerSize;
        this.size = this.minimumSize;
        this.offsetVector = new Vector(0,0,0);

        this.offsetState = new Transitionable(Transform.translate(0,0,0));
        this.offsetNode = this.add(new Modifier({transform: function(){return this.offsetState.get();}.bind(this)}));

    }

	DynamicConstraintLayout.prototype = Object.create(PositionableView.prototype);
	DynamicConstraintLayout.prototype.constructor = DynamicConstraintLayout;


	DynamicConstraintLayout.DEFAULT_OPTIONS = 
	{
        minimumContainerSize: [0,0],
        isAnimated: false,
        position: [0,0,0],
        edgePadding: [0,0]
    };

	DynamicConstraintLayout.prototype.addChild = function(child)
    {
        if (child instanceof PositionableView)
        {
            child.parent = this;
            this.children.push(child);
            var offsetModifier = new Modifier({
                transform:function(){return Transform.translate(child._dynamicOffset.x,child._dynamicOffset.y,1);}
            });

            this.offsetNode.add(offsetModifier).add(child.getModifier()).add(child.getRenderController());
            this._layoutDirty = true;

            //if (!constraintConfig)
            //    constraintConfig = {priority:this.children.length+1};
            //
            //child._constraintConfig = constraintConfig;

            //this.children = this.children.sort(function(a,b){
            //    a._constraintConfig.priority < b._constraintConfig.priority;
            //});
        }
        else
        {
            if (!child)
                console.error("Cannot add null child");
            else
                console.error("Child must be PositionableView. Child = " + child);
        }
	};

    DynamicConstraintLayout.prototype.removeChild = function(view)
    {
        var r = this.children.indexOf(view);
        if (r >= 0)
        {
            this.children.splice(r, 1);
            view.hide();
        }
    };

    DynamicConstraintLayout.prototype.setFixedChild = function(view)
    {
        if (this.children.indexOf(view) >= 0)
        {
            this._fixedChild = view;
        }
        else
            console.error("This is not my child: '" + view._globalId + "'");
    };


    DynamicConstraintLayout.prototype.calculateChildPosition = function(child, relativeTo){

        var basePosition = Vector.fromArray(PositionableView.prototype.calculateChildPosition.call(this,child,relativeTo));
        return basePosition.add(this.offsetVector).toArray();
    };

    function adjustToFit(fixedView,adjustView)
    {
        //Check if colliding
        //Adjust to resolve collision

        var viewAdjust = new Vector(0,0,0);

        var fpos = fixedView.position;
        if (fixedView._dynamicPosition)
            fpos = fixedView._dynamicPosition.toArray();

        var rectFixed = Rect.make(fpos,fixedView._dynamicSize.toArray());
        var rectAdjust = Rect.make(adjustView.position,adjustView._dynamicSize.toArray());

        var intersection = rectFixed.intersect(rectAdjust);

        if (intersection)
        {
            var leftAdjust = -((intersection.x - rectFixed.x) + intersection.width);
            var rightAdjust = (rectFixed.width + leftAdjust) + intersection.width;

            var topAdjust = -((intersection.y - rectFixed.y) + intersection.height);
            var bottomAdjust = (rectFixed.height + topAdjust) + intersection.height;


            if (adjustView._dynamicOffset && adjustView._dynamicOffset.length() > 0)
            {
                var offset = adjustView._dynamicOffset;

                if (offset.x > 0)
                    viewAdjust.x = rightAdjust;
                else if (offset.x < 0)
                    viewAdjust.x = leftAdjust;
                else if (offset.y < 0)
                    viewAdjust.y = topAdjust;
                else
                    viewAdjust.y = bottomAdjust;
            }
            else
            {

                var viewError = new Vector(0, 0, 0); // Vector.fromArray(adjustView.actualPosition).sub(Vector.fromArray(adjustView.position));

                var adjustX, adjustY;
                if (Math.abs(viewError.x + leftAdjust) < Math.abs(viewError.x + rightAdjust))
                    adjustX = leftAdjust;
                else
                    adjustX = rightAdjust;

                if (Math.abs(viewError.y + topAdjust) < Math.abs(viewError.y + bottomAdjust))
                    adjustY = topAdjust;
                else
                    adjustY = bottomAdjust;

                if (Math.abs(viewError.x + adjustX) < Math.abs(viewError.y + adjustY))
                    viewAdjust.x = adjustX;
                else
                    viewAdjust.y = adjustY;
            }

            adjustView._dynamicPosition = Vector.fromArray(adjustView.position).add(viewAdjust);
            adjustChild.call(this,adjustView);
        }
    }


    function adjustChild(child)
    {
        var children = this.children;

        if (child._dclAdjusted)
            return;

        child._dclAdjusted = true;

        for (var i=0;i<children.length;i++)
        {
            var c = children[i];
            if (c == child)
                continue;

            adjustToFit.call(this,child,c);
        }

    }

    function reflow()
    {
        var children = this.children;

        for (var i=0;i<children.length;i++)
        {
            children[i]._dclAdjusted = false;
            children[i]._dynamicPosition = Vector.fromArray(children[i].position);
        }

        if (this._fixedChild)
            adjustChild.call(this, this._fixedChild);

        for (i=0;i<children.length;i++)
        {
            adjustChild.call(this,children[i]);
        }
    }




    function _measureChildExtents(child)
    {
        var size = child._dynamicSize;
        var topLeft = Vector.fromArray(child.position);

        if (child._dynamicPosition)
            topLeft = child._dynamicPosition;

        var bottomRight = size.add(topLeft);

        return {
            bottomRight:bottomRight,
            topLeft:topLeft
        };
    }


    function measureChildren(requestedSize)
    {

        var containerSize = Vector.fromArray(this.minimumContainerSize);
        var children = this.children;

        var bottomRight = new Vector(0,0,0);
        var topLeft = new Vector(0,0,0);

        for (var i=0;i<children.length;i++)
        {
            var childExtents = _measureChildExtents(children[i]);

            bottomRight.x = Math.max(childExtents.bottomRight.x,bottomRight.x);
            bottomRight.y = Math.max(childExtents.bottomRight.y,bottomRight.y);

            topLeft.x = Math.min(childExtents.topLeft.x,topLeft.x);
            topLeft.y = Math.min(childExtents.topLeft.y,topLeft.y);
        }

        var edgePadding = this.options.edgePadding;
        var sizeVector = (bottomRight.sub(topLeft)).add(new Vector(edgePadding[0],edgePadding[1],0));

        topLeft = topLeft.multiply(-1);
        this.offsetVector = topLeft.clone();
        this.offsetState.set(Transform.translate(topLeft.x,topLeft.y,topLeft.z));

        containerSize.x = Math.max(sizeVector.x,containerSize.x);
        containerSize.y = Math.max(sizeVector.y,containerSize.y);

        for (var i=0;i<children.length;i++)
        {
            var child = children[i];
            if (child._dynamicSize.x == 0)
                child._dynamicSize.x = containerSize.x;

            if (child._dynamicSize.y == 0)
                child._dynamicSize.y = containerSize.y;
        }

        return {
            minimumSize: containerSize.toArray(2),
            maximumSize: containerSize.toArray(2)
        };
    }


    DynamicConstraintLayout.prototype.measure = function(requestedSize)
    {
        var children = this.children;

        for (var i=0;i<children.length;i++)
        {
            var child = children[i];
            child._dynamicSize = Vector.fromArray(child.measure().minimumSize);
        }

        reflow.call(this);

        return measureChildren.call(this,requestedSize);
    };

    DynamicConstraintLayout.prototype.layout = function(layoutSize){

        for (var i=0;i<this.children.length;i++)
        {
            var child = this.children[i];
            child.layout(child._dynamicSize.toArray(2));

            if (child._dynamicPosition)
                child._dynamicOffset = child._dynamicPosition.sub(Vector.fromArray(child.position));
        }

        PositionableView.prototype.layout.call(this,layoutSize);
    };

    DynamicConstraintLayout.prototype.needsLayout = function(){

        if (this._layoutDirty) return true;

        for (var i=0;i<this.children.length;i++)
        {
            if (this.children[i].needsLayout())
            {
                return true;
            }
        }
        return false;
    };


    module.exports = DynamicConstraintLayout;
});	