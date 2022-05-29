/* eslint-disable @typescript-eslint/no-explicit-any */
import Koa from "koa";
import socketServer from "src/socket_server";
import { mockContext } from "./__utils__/koa_mock";
import sinon, { spy } from "sinon";
import { WebSocket } from "ws";
import { expect } from "chai";
import mongoose from "mongoose";
import { ObjectId } from "src/control/types";

describe("The socketServer object", () => {
	describe("The handler middleware", () => {
		let ctx: Koa.ParameterizedContext<
			Koa.DefaultState,
			{
				websocket: sinon.SinonSpiedInstance<WebSocket>;
			}
		>;
		const next = async () => null;

		beforeEach(() => {
			ctx = mockContext() as any;
			ctx.websocket = spy(new WebSocket(null));
			ctx.websocket.send = spy() as any;
		});

		it("Should close the socket with 401 if the authorization header isn't set", () => {
			socketServer.handler()(ctx as any, next);
			expect(ctx.websocket.close.calledOnceWith(401)).to.be.true;
		});

		it("Should close the socket with 400 if the authorization scheme isn't Token", () => {
			ctx.header.authorization = "ASdfgsgfhdghfj";
			socketServer.handler()(ctx as any, next);
			expect(ctx.websocket.close.calledOnceWith(400)).to.be.true;
		});

		it("Should close the socket with 401 if the authorization token is invalid", () => {
			ctx.header.authorization = "Token fdgsgdfhfhghjgf";
			socketServer.handler()(ctx as any, next);
			expect(ctx.websocket.close.calledOnceWith(401)).to.be.true;
		});

		it("Should subscribe sockets whose tokens were granted with grantToken", () => {
			const testUserId = new mongoose.Types.ObjectId();
			const token = socketServer.grantToken(testUserId);
			ctx.header.authorization = `Token ${token}`;
			socketServer.handler()(ctx as any, next);
			socketServer.emitEvent(testUserId, "test");
			expect(ctx.websocket.send.calledWith('{"event":"test"}')).to.be.true;
		});
	});

	describe("grantToken()", () => {
		afterEach(() => {
			(socketServer as any).tokenMap = new Map();
		});

		it("should add a random token for the given user to the token map", () => {
			const testUserId = new mongoose.Types.ObjectId();
			socketServer.grantToken(testUserId);
			expect(
				Array.from((socketServer as any).tokenMap.values() as ObjectId[]).some(
					(val: ObjectId) => val.equals(testUserId)
				)
			).to.be.true;
		});

		it("should automatically revoke tokens after 5 seconds", async () => {
			const testUserId = new mongoose.Types.ObjectId();
			socketServer.grantToken(testUserId);
			await new Promise((res) => {
				setTimeout(() => {
					expect(
						Array.from(
							(socketServer as any).tokenMap.values() as ObjectId[]
						).some((val: ObjectId) => val.equals(testUserId))
					).to.be.false;
					res(null);
				}, 5000);
			});
		});
	});
});
