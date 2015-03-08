define(function(require,exports,module)
{

    var PositionableView = require('./PositionableView');
    var ListSelector = require('Views/ListSelector');

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

    PositionableViewSwitcher.prototype.addView = function (name, view)
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

    PositionableViewSwitcher.prototype.setActiveView = function (name)
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

    PositionableViewSwitcher.prototype.layout = function (layoutSize)
    {
        if (this.activeView)
        {
            this.activeView.layout(layoutSize);
        }

        this._layoutDirty = false;
        PositionableView.prototype.layout.call(this, layoutSize);
    };

    PositionableViewSwitcher.prototype.measure = function (requestedSize)
    {
        if (this.activeView)
            return this.activeView.measure(requestedSize);
        else
        {
            console.error("No active view, cannot measure");
        }
    };

    PositionableViewSwitcher.prototype.applyProperties = function (properties)
    {
        if (properties.activeViewName)
            this.setActiveView(properties.activeViewName);

        PositionableView.prototype.applyProperties.call(this, properties);
    };


    PositionableViewSwitcher.prototype.storeProperties = function (properties)
    {
        properties.activeViewName = this.activeViewName;


        PositionableView.prototype.storeProperties.call(this, properties);
    };

    PositionableViewSwitcher.prototype.needsLayout = function ()
    {
        if (PositionableView.prototype.needsLayout.call(this))
            return true;
        else if (this.activeView)
            return this.activeView.needsLayout();
        else
            return false;
    };

    PositionableViewSwitcher.prototype.getEditors = function()
    {
        var editors = PositionableView.prototype.getEditors.call(this);
        editors.push(new SwitcherEditor(this));
        return editors;
    };


    function SwitcherEditor(view)
    {
        this.view = view;
    }

    SwitcherEditor.prototype.createUI = function(menu)
    {
        var s = this.makeSelector();
        menu.addChild(s);
        s.hide = function(){ menu.removeChild(s)};
        this._activeUI = s;
    };

    SwitcherEditor.prototype.cleanup = function(editContext)
    {
        this._activeUI.hide();
    }

    SwitcherEditor.prototype.setModel = function(model,modelState)
    {
        this.model = model;
        this.modelState = modelState;
    };

    SwitcherEditor.prototype.makeSelector = function()
    {
        var selector = new ListSelector({
            size:[40,40]
        });

        var items = [];

        for (var viewName in this.view.viewMap)
        {
            items.push(viewName);
        }

        selector.setItems(items);
        selector.setSelectedItem(0);
        selector.on('itemSelected',function(data){
            this.view.setActiveView(data.item);
            this.model.getState(this.modelState).properties.set("activeView",data.item);
        }.bind(this));

        return selector;
    };





    module.exports = PositionableViewSwitcher;

});
