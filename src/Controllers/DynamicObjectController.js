define(function(require,exports,module){

    var DynamicGroupController = require('Controllers/DynamicGroupController');
    var ObjectEditModule = require('Modules/ObjectEditModule');
    var DynamicContainer = require('PositioningLayouts/DynamicContainer');


    function DynamicObjectController(objectDef, objectView)
    {
        DynamicGroupController.call(this,objectDef);

        this.objectView = objectView;
        this.getView();
    }

    DynamicObjectController.prototype = Object.create(DynamicGroupController.prototype);
    DynamicObjectController.prototype.constructor = DynamicObjectController;

    DynamicObjectController.prototype.getView = function()
    {
        if (this.controllers.length > 0)
        {
            if (!this.containerView)
            {
                if (_viewCanBeContainer.call(this))
                {
                    this.containerView = this.objectView;
                }
                else
                {
                    this.containerView = DynamicGroupController.prototype.getView.call(this);
                    injectView(this.containerView, this.objectView);
                }
            }
            return this.containerView;
        }
        else
        {
            return this.objectView;
        }
    };

    function _viewCanBeContainer()
    {
        var objectView = this.objectView;

        for (var i=0;i<this.controllers.length;i++)
        {
            var cv = this.controllers[i].getView();
            if (!cv)
            {
                //Controller is container-dependent
                return false;
            }

            if (cv.parent !== objectView)
                return false;
        }
        return true;
    }

    DynamicObjectController.prototype.getInputs = function()
    {
        var groupInputs = DynamicGroupController.prototype.getInputs.call(this);
        if (this.objectView.getInputEvents)
        {
            groupInputs.push(this.objectView.getInputEvents());
        }
        return groupInputs;
    };

    DynamicObjectController.prototype.getOutputs = function()
    {
        var groupOutputs = DynamicGroupController.prototype.getOutputs.call(this);
        if (this.objectView.getOutputEvents)
        {
            groupOutputs.push(this.objectView.getOutputEvents());
        }
        return groupOutputs;
    };

    DynamicObjectController.prototype.addController = function(controller)
    {
        if (this.controllers.length == 0)
        {
            DynamicGroupController.prototype.addController.call(this,controller);
            this.getView();
        }
        else
            DynamicGroupController.prototype.addController.call(this,controller);
    };

    DynamicObjectController.prototype.setEditMode = function(editMode, editContext)
    {
        DynamicGroupController.prototype.setEditMode.call(this,editMode, editContext);


        if (editMode == "IsEditing")
        {
            if (!this.objectEditor)
            {
                var objectEditor = new ObjectEditModule(this.objectView);

                if (this.canEditProperty("position"))
                {
                    objectEditor.onObjectMoved(function ()
                    {
                        this.objectDef.properties.set("position", this.objectView.position);
                        console.log("Set object position to " + this.objectView.position);
                    }.bind(this));
                }

                this.objectEditor = objectEditor;
            }

            this.objectEditor.show();
        }
        else
        {
            if (this.objectEditor)
                this.objectEditor.hide();
        }

    };

    DynamicGroupController.prototype.canEditProperty = function(propertyName)
    {
        switch (propertyName)
        {
            case "size":
            case "position":
                if (this.parent && this.objectView.parent instanceof DynamicContainer)
                {
                    return true;
                }
                break;
        }
        return false;
    };


    function injectView(container,objectView)
    {
        console.log("Injecting view. Object = " + objectView._globalId + " InjectedContainer = " + container._globalId);
        objectView.setPosition([0, objectView.position[1], 0]);
        objectView.setAlign([0,0]);
        objectView.setOrigin([0,0]);
        if (objectView.parent)
        {
            var index = objectView.parent.children.indexOf(objectView);

            objectView.parent.removeChild(objectView);
            objectView.parent.addChild(container, {
                weight: 2,
                index: index,
                align: 'center'
            });
        }
        container.addChild(objectView);
    }

    module.exports = DynamicObjectController;
});