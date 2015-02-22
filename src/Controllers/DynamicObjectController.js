define(function(require,exports,module){

    function DynamicObjectController(objectDef, objectView)
    {
        this.objectDef = objectDef;
        this.objectView = objectView;
        this.controllers = [];
        this.state = 'base';
    }

    DynamicObjectController.prototype.addController = function(controller){
        this.controllers.push(controller);
        controller.setState(this.state);
        controller.setEditMode(this.editMode);
    };

    DynamicObjectController.prototype.setEditMode = function(editMode){

        this.editMode = editMode;
        for (var i=0;i<this.controllers.length;i++)
        {
            this.controllers[i].setEditMode(editMode);
        }
    };

    DynamicObjectController.prototype.setState = function(state){
        this.state = state;

        for (var i=0;i<this.controllers.length;i++)
        {
            this.controllers[i].setState(state);
        }
    };

    DynamicObjectController.prototype.getView = function(){
        return this.objectView;
    };

    DynamicObjectController.prototype.getObjectDef = function(){
        return this.objectDef;
    };

    module.exports = DynamicObjectController;
});