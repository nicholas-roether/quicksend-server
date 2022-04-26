import Koa from "koa";
import Joi from "joi";

function bodyValidator(schema: Joi.Schema): Koa.Middleware {
	return (ctx, next) => {
		const { error, value: body } = schema.validate(ctx.request.body);
		if (error) return ctx.throw(error.message, 400);
		if (!body) return ctx.throw(500, "Unexpected error");
		return next();
	};
}

export default bodyValidator;
