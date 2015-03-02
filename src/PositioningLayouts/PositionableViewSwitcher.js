define(function(require,exports,module){

    var PositionableView = require('./PositionableView');

    function PositionableViewSwitcher(options)
    {
        PositionableView.call(this, options);

        this.viewMap = {};
    }

    PositionableViewSwitcher.prototype = Object.create(PositionableView.prototype);
    PositionableViewSwitcher.prototype.constructor = PositionableViewSwitcher;

    PositionableViewSwitcher.prototype.calculateSize = function ()
    {
        return this.activeView.calculateSize();
    };

    PositionableViewSwitcher.prototype.calculatePosition = function (relativeTo)
    {
        return this.activeView.calculatePosition();
    };

    PositionableViewSwitcher.prototype.calculateChildPosition = function (child, relativeTo)
    {

        return this.activeView.calculateChildPosition();
    };

    PositionableViewSwitcher.prototype.addView = function(name,view)
    {
        if (!this.viewMap[name])
        {
            this.viewMap[name] = view;
            this.add(view.getModifier()).add(view.getRenderController(true));
        }
        else
        {
            throw {
                message: "View with name '" + name + "' already exists."
            }
        }
    };

    PositionableViewSwitcher.prototype.setActiveView = function(name)
    {
        if (!name)
        {
            if (this.activeView)
                this.activeView.hide();

            this.activeViewName = "";
        }

        if (!this.viewMap[name])
        {
            throw {
                message: "View '" + name + "' not found"
            };
        }
        else if (this.viewMap[name] != this.activeView)
        {
            if (this.activeView)
                this.activeView.hide();

            this.activeView = this.viewMap[name];
            this.activeView.show();

            this.activeViewName = name;
            this.requestLayout();
        }

    };

    PositionableViewSwitcher.prototype.layout = function(layoutSize)
    {
        if (this.activeView)
        {
            this.activeView.layout(layoutSize);
        }

        this._layoutDirty = false;
        PositionableView.prototype.layout.call(this,layoutSize);
    };

    PositionableViewSwitcher.prototype.measure = function(requestedSize)
    {
        if (this.activeView)
            return this.activeView.measure(requestedSize);
        else
        {
            console.error("No active view, cannot measure");
        }
    };

    PositionableViewSwitcher.prototype.applyProperties = function(properties)
    {
        if (properties.activeViewName)
            this.setActiveView(properties.activeViewName);

        PositionableView.prototype.applyProperties.call(this,properties);
    };


    PositionableViewSwitcher.prototype.storeProperties = function(properties)
    {
        properties.activeViewName = this.activeViewName;


        PositionableView.prototype.storeProperties.call(this,properties);
    };

    PositionableViewSwitcher.prototype.needsLayout = function()
    {
        if (PositionableView.prototype.needsLayout.call(this))
            return true;
        else if (this.activeView)
            return this.activeView.needsLayout();
        else
            return false;
    };

    module.exports = PositionableViewSwitcher;

});
