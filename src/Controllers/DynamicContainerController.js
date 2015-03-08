define(function(require,exports,module){

    var AbstractObjectController = require('Controllers/AbstractObjectController');
    var DynamicConstraintLayout = require('PositioningLayouts/DynamicConstraintLayout');
    //var DynamicObjectController = require('./DynamicObjectController');
    var BoxView = require('PositioningLayouts/BoxView');
    var EditorFactory = require('Editors/EditorFactory');

    DynamicContainerController.prototype = Object.create(AbstractObjectController.prototype);
    DynamicContainerController.prototype.constructor = DynamicContainerController;

    function DynamicContainerController(objectDef, modelLoader)
    {
        AbstractObjectController.call(this,objectDef,modelLoader);
        this.containerView = _makeContainerView();
    }


    DynamicContainerController.prototype.getView = function()
    {
        return this.containerView;
    };

    DynamicContainerController.prototype.createEditTrigger = function()
    {
        this.destroyEditTrigger();

        var trigger = new BoxView({
            size: [10, undefined],
            clickable: true,
            color: Colors.EditColor,
            position:[0,0,10],
            viewAlign:[0,0.5],
            viewOrigin:[0,0.5]
        });

        this.containerView.add(trigger.getModifier()).add(trigger.getRenderController());

        this._activeEditTrigger = trigger;

        return trigger;
    };

    DynamicContainerController.prototype.destroyEditTrigger = function()
    {
        if (this._activeEditTrigger)
            this._activeEditTrigger.hide();
    };

    DynamicContainerController.prototype.createEditors = function(editContext)
    {
        DynamicObjectController.prototype.createEditors.call(this,editContext);
    };

    DynamicContainerController.prototype.destroyEditors = function()
    {
        DynamicObjectController.prototype.destroyEditors.call(this,editContext);
    };

    function _makeContainerView()
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
                return new EditorFactory.addMoveEditor(this.containerView,function(newPosition)
                {
                    this.objectDef.getState(this.state).set('position',newPosition);
                }.bind(this));
            case "delete":
                return new EditorFactory.addDeleteButton(this.containerView,function(){
                    this.parent.deleteControllerModel(this);
                }.bind(this));
            default:
                return AbstractObjectController.prototype.makeEditor.call(this,editorName);
        }
    }

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