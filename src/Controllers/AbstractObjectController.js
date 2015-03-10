define(function(require,exports,module){

    var Container = require('Model/Container');
    var Connection = require('Model/Connection');
    var ObjectCreationModule = require('Editors/ObjectCreationModule');
    var LineConnectionModule = require('Editors/LineConnectionModule');

    function AbstractObjectController(objectDef,modelLoader)
    {
        this.objectDef = objectDef;
        this.controllers = [];
        this.gapiModel = gapi.drive.realtime.custom.getModel(this.objectDef);
        this.modelLoader = modelLoader;
        this.state = 'base';

        this._specifiedState = undefined;

        _attachModel.call(this,objectDef);
    }

    AbstractObjectController.prototype = {};
    AbstractObjectController.prototype.constructor = AbstractObjectController;
    module.exports = AbstractObjectController;

    AbstractObjectController.prototype.getObjectDef = function(){
        return this.objectDef;
    };

    AbstractObjectController.prototype.addController = function(controller)
    {
        this.controllers.push(controller);
        controller.parent = this;

        controller.propagateState(this.state);
    };

    AbstractObjectController.prototype.removeController = function(controller)
    {
        var index = this.controllers.indexOf(controller);
        this.controllers.splice(index,1);
        controller.cleanup();
    };


    AbstractObjectController.prototype.cleanup = function()
    {

    };

    AbstractObjectController.prototype.setState = function(state)
    {
        this._specifiedState = state;

        var parentState = 'base';
        if (this.parent)
            parentState = this.parent.state || parentState;

        this.state = this._specifiedState || parentState;

        for (var i=0;i<this.controllers.length;i++)
        {
            this.controllers[i].propagateState(this.state);
        }

        this.setObjectState(this.state);
    };

    AbstractObjectController.prototype.createState = function(state)
    {
        if (!this.objectDef.hasState(state))
            this.objectDef.createState(state);

        for (var i=0;i<this.controllers.length;i++)
        {
            this.controllers[i].createState(state);
        }
    };

    //This would be protected if I was using Java
    AbstractObjectController.prototype.propagateState = function(state)
    {
        if (this._specifiedState == undefined)
        {
            this.state = state;

            this.setObjectState(this.state);

            for (var i=0;i<this.controllers.length;i++)
            {
                this.controllers[i].propagateState(this.state);
            }
        }
    };

    function _relationshipsAdded(event)
    {
        for (var i = 0; i < event.values.length; i++)
        {
            this.modelLoader.makeRelationship(this,event.values[i]);
        }
    }

    function _relationshipsRemoved(event)
    {
        for (var i = 0; i < event.values.length; i++)
        {
            var controller = getControllerWithObjectId.call(this,event.values[i]);

            if (!controller)
                console.error("Removed non-existent controller '" + event.values[i]);
            else
                this.removeController(controller);
        }
    }


    function getControllerWithObjectId(objectId)
    {
        for (var i=0;i<this.controllers.length;i++)
        {
            if (this.controllers[i].objectDef.id == objectId)
                return this.controllers[i];
        }
    }


    function _attachModel(model)
    {
        var relationshipList = model.relationships;

        if (relationshipList)
        {
            var r = relationshipList.asArray();
            for (var i = 0; i < r.length; i++)
            {
                this.modelLoader.makeRelationship(this, r[i]);
            }

            relationshipList.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, _relationshipsAdded.bind(this));
            relationshipList.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, _relationshipsRemoved.bind(this));
            relationshipList.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, function ()
            {
                console.error("SET IS NOT SUPPORTED OK");
            });
        }
    }


    AbstractObjectController.prototype.setObjectState = function(state)
    {

    };

    AbstractObjectController.prototype.getOutputs = function()
    {
        var outputs = [];
        for (var i=0;i<this.controllers.length;i++)
        {
            if (this.controllers[i].getOutputs)
            {
                var c = this.controllers[i].getOutputs();
                if (c instanceof Array)
                {
                    for (var j=0;j< c.length;j++)
                        outputs.push(c[j]);
                }
                else if (c)
                    outputs.push(c);
            }
        }

        return outputs;
    };

    AbstractObjectController.prototype.getInputs = function(name)
    {
        var inputs = [];
        for (var i=0;i<this.controllers.length;i++)
        {
            if (this.controllers[i].getInputs)
            {
                var c = this.controllers[i].getInputs(name);
                if (c instanceof Array)
                {
                    for (var j=0;j< c.length;j++)
                        inputs.push(c[j]);
                }
                else if (c)
                    inputs.push(c);
            }
        }

        return inputs;
    };

    AbstractObjectController.prototype.createEditTrigger = function()
    {
        throw "I'm abstract LOL";
    };

    AbstractObjectController.prototype.destroyEditTrigger = function()
    {
        throw "I'm abstract LOL";
    };

    AbstractObjectController.prototype.createEditors = function(editContext)
    {

    };

    AbstractObjectController.prototype.destroyEditors = function()
    {

    };

    AbstractObjectController.prototype.deleteControllerModel = function(childModel)
    {
        console.log("Deleting object: " + childModel.id);

        var r = this.objectDef.relationships;
        if (!r.removeValue(childModel.id))
        {
            for (var i=0;i< r.length;i++)
            {
                if (r.get(i).id == childModel.id || r.get(i).to == childModel.id)
                {
                    r.remove(i);
                    break;
                }
            }
        }
    };

    AbstractObjectController.prototype.hasControllerType = function(controllerType)
    {
        for (var i=0;i<this.controllers.length;i++)
        {
            if (this.controllers[i] instanceof controllerType)
                return true;
        }
        return false;
    };

    AbstractObjectController.prototype.makeEditor = function(editorName)
    {
        switch (editorName)
        {
            case "add":
                return new ObjectCreationModule(this, this.objectDef);
            default:
                return null;
            //case "connect":
            //    return new LineConnectionModule();
        }
    };


});