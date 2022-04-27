import Koa from "koa";
import Joi from "joi";

function bodyValidator(schema: Joi.Schema): Koa.Middleware {
	return (ctx, next) => {
		const { error, value: body } = schema.validate(ctx.request.body);
		if (error) return ctx.throw(400, error.message);
		if (!body) return ctx.throw(400, "Unexpected empty request body");
		return next();
	};
}

export default bodyValidator;
