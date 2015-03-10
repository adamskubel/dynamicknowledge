define(function(require,exports,module){

    var AbstractObjectController = require('Controllers/AbstractObjectController');
    var DynamicConstraintLayout = require('PositioningLayouts/DynamicConstraintLayout');
    var Colors = require('Colors');
    var BoxView = require('PositioningLayouts/BoxView');
    var EditorFactory = require('Editors/EditorFactory');
    var DynamicObjectController = require('Controllers/DynamicObjectController');
    var Utils = require('Utils');

    DynamicContainerController.prototype = Object.create(AbstractObjectController.prototype);
    DynamicContainerController.prototype.constructor = DynamicContainerController;

    function DynamicContainerController(objectDef, modelLoader)
    {
        this.containerView = this.makeContainerView();
        AbstractObjectController.call(this,objectDef,modelLoader);
    }

    DynamicContainerController.prototype.addController = function(controller)
    {
        AbstractObjectController.prototype.addController.call(this,controller);

        if (controller.getView().parent != this.containerView)
        {
            this.containerView.addChild(controller.getView());
        }
    };


    DynamicContainerController.prototype.removeController = function(controller)
    {
        AbstractObjectController.prototype.removeController.call(this,controller);

        if (controller.getView().parent == this.containerView)
        {
            this.containerView.removeChild(controller.getView());
        }
    };


    DynamicContainerController.prototype.cleanup = function()
    {
        if (this.parent && this.parent.getView() && this.parent.getView().parent == this.containerView)
            Utils.extractContainer(this.containerView,this.parent.getView());
    };


    DynamicContainerController.prototype.getView = function()
    {
        return this.containerView;
    };

    DynamicContainerController.prototype.makeMenuBar = function()
    {
        return DynamicObjectController.prototype.makeMenuBar.call(this);
    };

    DynamicContainerController.prototype.createEditTrigger = function()
    {
        this.objectView = this.containerView;
        return DynamicObjectController.prototype.createEditTrigger.call(this);
    };

    DynamicContainerController.prototype.destroyEditTrigger = function()
    {
        DynamicObjectController.prototype.destroyEditTrigger.call(this);
    };

    DynamicContainerController.prototype.createEditors = function(editContext)
    {
        this.objectView = this.containerView;
        DynamicObjectController.prototype.createEditors.call(this,editContext);
    };

    DynamicContainerController.prototype.destroyEditors = function()
    {
        DynamicObjectController.prototype.destroyEditors.call(this);
    };

    DynamicContainerController.prototype.makeContainerView = function()
    {
        var dc = new DynamicConstraintLayout();

        var containerBackground = new BoxView({
            color: 2000,
            style: 'borderOnly',
            size: [undefined,undefined]
        });

        dc.add(containerBackground.getModifier()).add(containerBackground.getRenderController());

        return dc;
    }

    DynamicContainerController.prototype.makeEditor = function(editorName)
    {
        switch (editorName)
        {
            case "position":
                return (new EditorFactory()).addMoveEditor(this.containerView,function(newPosition)
                {
                    this.objectDef.getState(this.state).properties.set('position',newPosition);
                }.bind(this));
            case "delete":
                return (new EditorFactory()).addDeleteButton(this.containerView,function(){
                    this.parent.deleteControllerModel(this.objectDef);
                }.bind(this));
            default:
                return AbstractObjectController.prototype.makeEditor.call(this,editorName);
        }
    };

    DynamicContainerController.prototype.createEditRules = function(editContext)
    {
        var editors = [];

        if (editContext.isGlobal)
        {
            editors.push("connect");
            editors.push("add");
        }
        else
        {
            if (this.parent)
            {
                editors.push("delete");

                if (this.containerView.parent.childControlsPosition())
                    editors.push("position");
            }

            editors.push("add");
        }

        return editors;
    };



    module.exports = DynamicContainerController;

});