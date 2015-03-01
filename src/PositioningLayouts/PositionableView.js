define(function (require, exports, module)
{

    var Engine = require("famous/core/Engine");
    var Surface = require("famous/core/Surface");
    var Transform = require("famous/core/Transform");
    var Modifier = require("famous/core/Modifier");
    var View = require('famous/core/View');
    var Transitionable = require('famous/transitions/Transitionable');
    var Easing = require('famous/transitions/Easing');
    var Utils = require('../Utils');
    var Vector = require('../ProperVector');

    var id;

    function PositionableView(options)
    {
        View.call(this, options);

        this.name = (this.options.name) ? this.options.name : this.constructor.name;
        id = (new Utils()).nextIdentifier(this.name);

        this._globalId = id;


        this.size = this.options.size;
        this.position = this.options.position;

        this.viewAlign = (this.options.viewAlign);
        this.viewOrigin = this.options.viewOrigin;

        this.isAnimated = (this.options.isAnimated != undefined) ? this.options.isAnimated : PositionableView.DEFAULT_OPTIONS.isAnimated;

        this.positionTransition = PositionableView.DEFAULT_OPTIONS.positionTransition;
        this.sizeTransition = PositionableView.DEFAULT_OPTIONS.sizeTransition;
        this.opacityTransition = undefined;

        this._layoutDirty = false;


        if (this.position)
            this.positionState = new Transitionable(Transform.translate(this.position[0], this.position[1], this.position[2]));

        if (this.size)
            this.sizeState = new Transitionable(this.size);

        if (this.viewAlign)
            this.alignState = new Transitionable(this.viewAlign);

        this.opacityState = new Transitionable(1);


        //console.debug("Created " + id);
    }

    PositionableView.prototype = Object.create(View.prototype);
    PositionableView.prototype.constructor = PositionableView;


    PositionableView.DEFAULT_OPTIONS =
    {
        position:[0,0,0],
        isAnimated: true,
        positionTransition: {duration: 250, curve: Easing.outQuad},
        sizeTransition: {duration: 250, curve: Easing.outQuad}
    };

    PositionableView.prototype.childControlsPosition = function()
    {
        return true;
    };

    PositionableView.prototype.calculateSize = function ()
    {

        if (this._size)
            return this._size;
        if (this.parent)
            return this.parent.calculateChildSize(this);

        if (this.size)
            return this.size;
        else
            return [0,0];
    };

    PositionableView.prototype.calculatePosition = function (relativeTo)
    {
        if (relativeTo == this)
            return [0,0,0];
        else if (this.parent)
            return this.parent.calculateChildPosition(this,relativeTo);

        return this.position;
    };

    PositionableView.prototype.calculateChildPosition = function (child, relativeTo)
    {
        var myPosition = Vector.fromArray(this.calculatePosition(relativeTo));
        var childOffset = (child.position) ? Vector.fromArray(child.position) : new Vector(0,0,0);

        var originAdjustment = (child.viewAlign) ? Vector.fromArray(child.viewAlign) : new Vector(0,0,0);
        var myOrigin = (this.viewOrigin) ? Vector.fromArray(this.viewOrigin) : new Vector(0,0,0);

        originAdjustment = originAdjustment.sub(myOrigin).multiply(Vector.fromArray(this.calculateSize()));

        return myPosition.add(childOffset).add(originAdjustment).toArray();
    };

    PositionableView.prototype.calculateChildSize = function (child)
    {
        return child.measure().minimumSize;
    };

    PositionableView.prototype.constructor = PositionableView;

    PositionableView.prototype.getModifier = function getModifier()
    {
        if (this.modifier == undefined)
        {
            var view = this;
            this.modifier = new Modifier({
                size: function ()
                {
                    if (view.sizeState)
                        return view.sizeState.get();
                },
                transform: function ()
                {
                    if (view.positionState)
                        return view.positionState.get();
                }
                , align: function ()
                {
                    if (view.alignState)
                        return view.alignState.get();
                },
                origin: function ()
                {
                    if (view.viewOrigin)
                        return view.viewOrigin;
                },
                opacity: function ()
                {
                    if (view.opacityState)
                        return view.opacityState.get();
                }
            });
        }
        return this.modifier;
    };

    PositionableView.prototype.getRenderController = function(hide){

        if (!this.renderController)
        {
            Utils.attachRenderController(this);
        }

        if (!hide)
        {
            this.renderController.show(this);
        }

        return this.renderController;
    };

    PositionableView.prototype.applyProperties = function(properties)
    {
        if (properties.position)
            this.setPosition(properties.position);

        if (properties.size)
            this.setSize(properties.size);
    };

    PositionableView.prototype.setAnimated = function (isAnimated)
    {
        this.isAnimated = isAnimated;
    };

    function _setPosition(position)
    {
        this.actualPosition = position;
        if (this.positionState)
        {
            if (this.positionState.isActive())
                this.positionState.halt();

            this._eventOutput.emit('positionChange', {newPosition: position});
            this.positionState.set(Transform.translate(position[0], position[1], position[2]), (this.isAnimated) ? this.positionTransition : null);
        }
        else
        {
            this.positionState = new Transitionable(Transform.translate(position[0],position[1], position[2]));
        }
    }

    PositionableView.prototype.setPosition = function (position)
    {
        if (!position)
            position = [0,0,0];

        _setPosition.call(this,position);
        this.position = position;
    };

    function _setSize(newSize)
    {
        //console.debug(this._globalId + "_SIZE: " + this._size + " --> " + newSize);
        if (this.sizeState)
        {
            if (this.sizeState.isActive())
                this.sizeState.halt();
            this.sizeState.set(newSize, (this.isAnimated && this._size) ? this.sizeTransition : null);
        }
        else
        {
            this.sizeState = new Transitionable(newSize);
        }
    }

    PositionableView.prototype.setSize = function (newSize)
    {
        _setSize.call(this,newSize);
        //console.log(this._globalId + " SetSize = " + newSize);
        this.size = newSize;
    };

    PositionableView.prototype.setAlign = function (newAlign)
    {
        if (this.alignState)
        {
            if (this.alignState.isActive())
                this.alignState.halt();
            this.alignState.set(newAlign, (this.isAnimated && this.viewAlign) ? this.positionTransition : null);
        }
        else
        {
            this.alignState = new Transitionable(newAlign);
        }
        this.viewAlign = newAlign;
    };

    PositionableView.prototype.setOrigin = function (newOrigin)
    {
        this.viewOrigin = newOrigin;
    };

    PositionableView.prototype.setDynamicSizes = function (sizes)
    {
        if (sizes)
        {
            this.minimumSize = sizes.minimumSize;
            this.maximumSize = sizes.maximumSize;
        }
        else
        {
            this.minimumSize = undefined;
            this.maximumSize = undefined;
        }
    };

    PositionableView.prototype.measure = function (requestedSize)
    {
        return {
            minimumSize: (this.minimumSize) ? this.minimumSize : this.size,
            maximumSize: (this.maximumSize) ? this.maximumSize : this.size
        };
    };

    PositionableView.prototype.layout = function (layoutSize, layoutPosition)
    {
        _setSize.call(this,layoutSize);

        if (layoutPosition)
            _setPosition.call(this,layoutPosition);

        this._size = layoutSize;
        this._layoutDirty = false;
    };

    PositionableView.prototype.requestLayout = function ()
    {
        this._layoutDirty = true;
    };

    PositionableView.prototype.needsLayout = function ()
    {
        return this._layoutDirty;
    };

    PositionableView.prototype.setOpacity = function (opacity)
    {
        this.opacityState.set(opacity, this.opacityTransition);
    }

    module.exports = PositionableView;
});	