import WebGLManager from './WebGLManager';
import { GLFramebuffer, GLTexture } from 'pixi-gl-core';

/**
 * @class
 * @extends PIXI.WebGLManager
 * @memberof PIXI
 */
export default class FramebufferManager extends WebGLManager
{
    /**
     * @param {PIXI.WebGLRenderer} renderer - The renderer this manager works for.
     */
    constructor(renderer)
    {
        super(renderer);
    }

    /**
     * Sets up the renderer context and necessary buffers.
     *
     * @private
     */
    onContextChange()
    {
        this.gl = this.renderer.gl;
        this.CONTEXT_UID = this.renderer.CONTEXT_UID;

        this.drawBufferExtension = this.gl.getExtension('WEBGL_draw_buffers');
    }

    bindFramebuffer(framebuffer)
    {
        const gl = this.gl;

        if(framebuffer)
        {
            // TODO cacheing layer!
            const fbo = framebuffer.glFrameBuffers[this.CONTEXT_UID] || this.initFramebuffer(framebuffer);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
            // makesure all textures are unbound..

            // now check for updates...
            if(fbo.dirtyId !== framebuffer.dirtyId)
            {
                fbo.dirtyId = framebuffer.dirtyId;

                this.updateFramebuffer(framebuffer);
            }

            this.renderer.newTextureManager.unbindTexture(framebuffer.colorTextures[0].glTextures[this.CONTEXT_UID]._bound)
        }
        else
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }

    clearFramebuffer(r, g, b, a)
    {
        var gl = this.gl;

        // TODO clear color can be set only one right?
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    initFramebuffer(framebuffer)
    {
        var fbo = GLFramebuffer.createRGBA(this.gl, framebuffer.width, framebuffer.height);

        framebuffer.glFrameBuffers[this.CONTEXT_UID] = fbo;

        console.log('framebuffer created!', fbo)

        return fbo;
    }

    updateFramebuffer(framebuffer)
    {
        const gl = this.gl;

        const fbo = framebuffer.glFrameBuffers[this.CONTEXT_UID];

        // bind the color texture
        const colorTextures = framebuffer.colorTextures;

        let count = colorTextures.length;

        if(!this.drawBufferExtension)
        {
            count = Math.min(count, 1);
        }

        const activeTextures = [];

        for (var i = 0; i < count; i++)
        {
            const texture = framebuffer.colorTextures[i];

            this.renderer.newTextureManager.bindTexture(texture, 0);

            const glTexture = texture.glTextures[this.CONTEXT_UID];

            activeTextures.push(gl.COLOR_ATTACHMENT0 + i);

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, glTexture.texture, 0);
        }

        if(this.drawBufferExtension && activeTextures.length > 1)
        {
            this.drawBufferExtension.drawBuffersWEBGL(activeTextures);
        }

        if(framebuffer.stencil || framebuffer.depth)
        {
            fbo.enableStencil();
        }
    }

}