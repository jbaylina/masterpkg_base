# Documentació del la configuració de la API
### Creació del model
Inicialitzem l'objecta api:
```js
var api = __mods.api;
```

Definició global de la classe. El "name" s'utilitza per agrupar i la descripció es un resum básic de totes les funcions.
```js
api.addTag({
	name: "Activities",
	description: "Actions to manage activities",
});
```

Definició de l'objecte model que retornem:
```js
api.addModel({
	name: "activity",
	type: "object",
	properties: {
		idActivity: {
			type: "integer",
			format: "int64"
		},
		title: {
			type: "string",
		}
	}
});
```

I per cada funció hem de definir el path:
```js
var schemaGets = {
		/* CREACIÓ DEL MODEL */
	};
api.addPath(schemaGets);
```

### El model:
- **name**: Nom del model
- **path**: Url de l'api sense l'apiprefix
- **method**: Method de la funció
- **description**: Descripció extensa sobre que fa la funció
- **summary**: Resdum del que fa la funció
- **validation**: Cada un dels camps que necesita validació amb format Joi
- **resp200**: Descripció + model de resposta
- **parameters**: Array de parametres, directa a l'estructura swagger [Visit swagger doc](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#parameter-object)
- **handler**: Funció que executará l'api
- **middleware** = joiExpress.joiValidate(ESQUEMA_PER_VALIDAR);

Ejemplo completo:
```js
var schemaGet = {
		name: 'Activities',
		path: '/activities/{idItem}',
		method: 'get',
		description: 'Obtener una actividad',
		summary: 'Obtener actividad',
		validation: {
			idItem: Joi.string().alphanum().min(3).max(15).required()
		},
		resp200: {
			description: 'resposta get',
			model: 'activity'
		},
		parameters: [
			{
				name: "idItem",
				in: "path",
				description: "ID of activity",
				required: true,
				type: "integer",
				items: {
					type: "integer"
				}
			}
		],
		handler: getItem
	};
api.addPath(schemaGet);
```


### Validacions
Dins del model queda de la següent forma:
```js
validation: {
	title: Joi.string().alphanum().min(3).max(15).required(),
	idItem: Joi.number(),
	idActivity: Joi.number()
},
```
La documentació per les validaciones es la mateixa que la del Joi: [Visit Joi especf.](https://github.com/hapijs/joi/blob/master/API.md)



### Documentació
Aixó ens generarrar un JSON a [Url server](http://localhost:3000/api/swagger) que podem veure amb el format swagger a [Swagger UI](http://petstore.swagger.io/#/)


### TODO
* Passar el "validation" a cada un dels camps de parameters
	- 2 opcions, o fem que el parametres, es tradueixi a un objecte joi, o que el joi es tradueixi a paramtetres swagger
* Resp200 millor fer un num, per així poder crear el 404, 503... etc
* 